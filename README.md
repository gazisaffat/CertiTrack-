# CertiTrack

A full-stack registry for sustainability certification applications. Factories browse schemes such
as GOTS, GRS, SA8000 and ISO 14001, submit an application for a site, and follow the review to a
decision. Reviewers work a queue, record a decision with a note, and manage the scheme catalogue.

**Live app:** _add your Vercel URL_ · **API:** _add your Render URL_

![CertiTrack home page](docs/screenshot-home.png)

---

## Why this project

Certification work in the textile and agriculture supply chain is run on spreadsheets and email
threads. The scheme requirements live in one PDF, the application in an inbox, and the decision in a
third place. CertiTrack puts the three in one record, with an audit trail that both sides can see.

## Features

**Public**

- Scheme registry with server-side search, category filter, sort and pagination
- Scheme detail page: cycle length, indicative fee, and the document checklist for the audit

**Applicant**

- Firebase sign-up and sign-in (email/password and Google)
- Submit an application per scheme, with the fee frozen at the moment of submission
- Track status, read the reviewer's note, withdraw while the file is still open
- Personal dashboard with a status breakdown

**Reviewer (admin)**

- Review queue with status filter and search across company, email and scheme
- Record a decision — move to review, approve, reject — with a note the applicant sees
- Full CRUD over the scheme catalogue, with a soft-delete guard on schemes that have applications
- Platform-wide statistics on the same dashboard component the applicant sees

## Stack

| Layer    | Choice                                                               |
| -------- | -------------------------------------------------------------------- |
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Context API |
| Auth     | Firebase Authentication (client) + firebase-admin and JWT (server)    |
| Backend  | Node.js, Express 4                                                    |
| Database | MongoDB with Mongoose                                                 |
| CI/CD    | GitHub Actions, Vercel (client), Render (server)                      |

---

## Architecture

```
client/  (Next.js App Router)        server/  (Express)
  src/                                 src/
    middleware.ts   edge route guard     config/      db + firebase-admin
    app/                                 middleware/  verifyToken, verifyAdmin, errors
      page.tsx          server           models/      User, Scheme, Application
      schemes/          server           controllers/ business logic
      apply/[id]/       server + form    routes/      Express routers
      dashboard/        client           utils/seed.js
      login, register   client
    lib/            api, types, firebase
    context/        AuthContext
    components/     UI
```

### Which pages render where, and why

| Route              | Rendering | Reason                                                       |
| ------------------ | --------- | ------------------------------------------------------------ |
| `/`                | Server    | Featured schemes are in the initial HTML — no spinner        |
| `/schemes`         | Server    | Search and filters are `searchParams`, so a filtered view is shareable and indexable |
| `/schemes/[id]`    | Server    | `generateMetadata` gives each scheme its own title and description |
| `/apply/[id]`      | Both      | Scheme fetched on the server, the form is a client component |
| `/dashboard/*`     | Client    | Personalised and token-bound; nothing to gain from SSR       |

Server Components fetch with `cache: 'no-store'`, which keeps the registry fresh and keeps those
routes dynamic — so `next build` never tries to reach the API while building.

Firebase Auth is initialised lazily in `lib/firebase.ts` and only in the browser. Calling `getAuth()`
at module scope breaks the build, because the root layout is evaluated on the server during
prerendering and the SDK has no browser to attach to.

### How authentication works

The client authenticates with Firebase, then trades the Firebase ID token for the app's own JWT:

```
Browser                       Express                     Firebase
   │  signIn()                                                 │
   ├──────────────────────────────────────────────────────────►│
   │◄───────────────────────────── ID token ───────────────────┤
   │  POST /api/auth/session { idToken }                       │
   ├─────────────────────────────►│  verifyIdToken()           │
   │                              ├───────────────────────────►│
   │                              │  upsert user, read role    │
   │◄──── { token, user } ────────┤                            │
   │  Authorization: Bearer <JWT> on every protected call       │
```

Two decisions worth calling out:

- **The client never asserts its own role.** `role` is read from MongoDB and signed into the JWT
  server-side. `verifyAdmin` is the actual guard, and it re-reads the role from the database so a
  demotion takes effect immediately.
- **Three layers of routing guard, only one of which is security.** `middleware.ts` runs at the edge
  and redirects anyone without a session cookie away from `/dashboard` and `/apply`, so a protected
  page never flashes before a client-side redirect. It checks only that the cookie is *present* — it
  cannot verify the signature, because the JWT secret belongs on the API server, not in the edge
  bundle. Admin-only pages redirect in the client, since the role lives inside the signed token.
  Neither is authorisation: `verifyToken` and `verifyAdmin` on the Express API are.
- **Ownership is checked against the token, not the request body.** Withdrawing an application
  compares `application.applicantUid` to `req.user.uid`.

### Data model notes

- `Application` stores `feeAtSubmission`, `schemeCode` and `schemeName` as a snapshot. Repricing a
  scheme must not rewrite what an applicant agreed to, and the list renders without a join.
- A partial unique index blocks a second **open** application for the same scheme by the same user,
  while still allowing a re-application after a rejection or withdrawal:

  ```js
  { applicantUid: 1, scheme: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['submitted','under_review','approved'] } } }
  ```

- Deleting a scheme that has applications archives it (`active: false`) instead of removing it, so
  historical records keep a valid reference.

## API

| Method | Endpoint                           | Access    |
| ------ | ---------------------------------- | --------- |
| POST   | `/api/auth/session`                | public    |
| GET    | `/api/auth/me`                     | signed in |
| GET    | `/api/schemes`                     | public    |
| GET    | `/api/schemes/categories`          | public    |
| GET    | `/api/schemes/:id`                 | public    |
| POST   | `/api/schemes`                     | admin     |
| PATCH  | `/api/schemes/:id`                 | admin     |
| DELETE | `/api/schemes/:id`                 | admin     |
| POST   | `/api/applications`                | signed in |
| GET    | `/api/applications/mine`           | signed in |
| PATCH  | `/api/applications/:id/withdraw`   | owner     |
| GET    | `/api/applications`                | admin     |
| PATCH  | `/api/applications/:id/status`     | admin     |
| GET    | `/api/stats/overview`              | signed in |

`/api/schemes` accepts `search`, `category`, `sort` (`name`, `fee-asc`, `fee-desc`, `newest`),
`page` and `limit`.

---

## Running locally

**Prerequisites:** Node 20+, a MongoDB Atlas cluster (or local `mongod`), and a Firebase project
with Email/Password and Google sign-in enabled.

### 1. Server

```bash
cd server
npm install
cp .env.example .env      # fill in the values below
npm run seed              # loads nine certification schemes
npm run dev               # http://localhost:5000
```

`server/.env`:

| Variable                       | Notes                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `MONGODB_URI`                  | Atlas connection string                                                        |
| `JWT_SECRET`                   | Any long random string — `openssl rand -hex 32`                                 |
| `JWT_EXPIRES_IN`               | Defaults to `7d`                                                               |
| `CLIENT_ORIGIN`                | Comma-separated allowed origins (`http://localhost:3000` in dev)                                                |
| `FIREBASE_SERVICE_ACCOUNT_B64` | `base64 -i serviceAccount.json \| tr -d '\n'` — one line, no newline escaping   |

### 2. Client

```bash
cd client
npm install
cp .env.example .env.local   # Firebase web config + NEXT_PUBLIC_API_BASE_URL
npm run dev                  # http://localhost:3000
```

### 3. Make yourself an admin

Sign in through the app once so the user record exists, then:

```bash
cd server
npm run seed -- your@email.com
```

Sign out and back in to pick up the new role in your JWT.

## Deploying

**Client → Vercel.** Root directory `client`. Vercel detects Next.js and needs no build
configuration. Add the `NEXT_PUBLIC_*` variables, including `NEXT_PUBLIC_API_BASE_URL` pointing at
the deployed API — the Next.js server uses it during SSR as well as the browser, so it must be a
public URL, not `localhost`.

**Server → Render.** Root directory `server`, build `npm install`, start `npm start`. Add every
variable from `.env.example`, and set `CLIENT_ORIGIN` to the deployed Vercel URL.

## Known gaps

Honest list of what is not built yet: no file upload for the audit documents (the checklist is
informational), no email notification on a status change, and no automated test suite — CI currently
runs a type-check and a build only. The session cookie is readable by JavaScript because the browser
attaches it as a bearer header; moving to an httpOnly cookie would mean proxying API calls through
Next.js route handlers, which is the next thing I would change.

## Licence

MIT
