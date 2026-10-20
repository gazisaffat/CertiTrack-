# CertiTrack — 7-day build & push plan

Each day is a **working commit**: the app runs at the end of every day, nothing is half-wired. Push
one day at a time, and don't move on until that day's "Check it runs" step passes on your machine.

Under each day there is a **Understand before you push** list. Those are the exact things an
interviewer will ask about that slice of code. If you can't answer one, read the file again or ask —
pushing code you can't explain is worse than pushing nothing.

Keep the full project folder somewhere outside the repo, and copy each day's files across as you go.

---

## Day 0 — Set up the repo (15 minutes)

```bash
mkdir certitrack && cd certitrack
git init
git branch -M main
```

Create the GitHub repo (empty, no README), then:

```bash
git remote add origin git@github.com:gazisaffat/certitrack.git
```

---

## Day 1 — Express server skeleton

**Copy these files**

```
.gitignore
README.md                          ← just the title + one-paragraph description for now
server/package.json
server/.env.example
server/src/index.js
server/src/config/db.js
server/src/middleware/errorHandler.js
```

Comment out the four `app.use('/api/...')` lines and their four route imports in `index.js` — those
files don't exist yet. Uncomment them as each one arrives on Days 3 and 4.

**Check it runs**

```bash
cd server && npm install
cp .env.example .env               # fill MONGODB_URI and JWT_SECRET
npm run dev
curl http://localhost:5000/health  # → {"status":"ok","uptime":...}
```

**Understand before you push**

- Why `connectDB()` resolves before `app.listen()` runs, instead of both starting together.
- What `errorHandler` does with a Mongoose `ValidationError` versus a plain thrown error, and why
  it checks `err.code === 11000`.
- Why the CORS origin is read from an env var instead of being hard-coded.

```bash
git add .
git commit -m "chore: scaffold Express server with Mongo connection and error handling"
git push -u origin main
```

---

## Day 2 — Data models and seed data

**Copy these files**

```
server/src/models/User.js
server/src/models/Scheme.js
server/src/models/Application.js
server/src/utils/seed.js
```

**Check it runs**

```bash
cd server && npm run seed        # → [seed] schemes — inserted: 9, updated: 0
```

**Understand before you push**

- `Application` stores `schemeCode`, `schemeName` and `feeAtSubmission` even though it also has a
  `scheme` reference. Why duplicate them? (Two reasons: the list renders without a join, and
  repricing a scheme must not rewrite what an applicant already agreed to.)
- The partial unique index on `{ applicantUid, scheme }`. What does `partialFilterExpression` do
  here, and why would a plain `unique: true` be wrong? (It would block re-applying after a rejection.)
- Why `seed.js` uses `bulkWrite` with `upsert` instead of `insertMany`.

```bash
git commit -am "feat(db): add User, Scheme and Application models with a seed script"
git push
```

---

## Day 3 — Authentication

**Copy these files**

```
server/src/config/firebaseAdmin.js
server/src/middleware/auth.js
server/src/controllers/authController.js
server/src/routes/authRoutes.js
```

Uncomment the `authRoutes` import and `app.use('/api/auth', authRoutes)` line in `index.js`.

**Check it runs**

```bash
curl http://localhost:5000/api/auth/me            # → 401 {"error":"Missing bearer token"}
curl -X POST http://localhost:5000/api/auth/session \
  -H 'Content-Type: application/json' -d '{}'     # → 400 {"error":"idToken is required"}
```

**Understand before you push**

- **This is the single most important thing in the project.** Trace the flow: the browser signs in
  with Firebase → gets an ID token → posts it to `/api/auth/session` → the server verifies it with
  `firebase-admin` → reads the role from MongoDB → signs its own JWT. Be ready to draw it.
- Why the server doesn't just trust an email the client sends. (Anyone could post any email and get
  an admin token.)
- Why `verifyAdmin` re-reads the role from the database instead of using `req.user.role` from the
  token. (A demoted admin's old token stays valid until it expires.)
- Why the service account is stored base64-encoded. (The private key has newlines; one line survives
  a hosting dashboard intact.)

```bash
git commit -am "feat(auth): verify Firebase ID tokens and issue app JWTs"
git push
```

---

## Day 4 — The rest of the API

**Copy these files**

```
server/src/controllers/schemeController.js
server/src/controllers/applicationController.js
server/src/routes/schemeRoutes.js
server/src/routes/applicationRoutes.js
server/src/routes/statsRoutes.js
```

Uncomment the remaining three `app.use('/api/...')` lines in `index.js`.

**Check it runs**

```bash
curl 'http://localhost:5000/api/schemes?search=organic'   # → GOTS and OCS
curl 'http://localhost:5000/api/schemes/categories'       # → five categories
curl http://localhost:5000/api/applications               # → 401
```

**Understand before you push**

- In `schemeRoutes.js`, why `/categories` must be declared **before** `/:id`. (Otherwise Express
  matches "categories" as an id and Mongo throws a CastError.)
- `withdrawApplication` compares `application.applicantUid` with `req.user.uid`. Why is checking a
  user id from the request body instead a security hole?
- `deleteScheme` archives (`active: false`) when applications exist and hard-deletes otherwise. Why?
- `getOverviewStats` serves both roles from one route. Where does the scoping happen?

```bash
git commit -am "feat(api): scheme CRUD, application lifecycle and stats endpoints"
git push
```

The backend is now complete. Good place to stop and re-read it end to end.

---

## Day 5 — Next.js client shell

**Copy these files**

```
client/package.json
client/next.config.mjs
client/tsconfig.json
client/postcss.config.mjs
client/tailwind.config.ts
client/.env.example
client/src/app/globals.css
client/src/app/layout.tsx
client/src/app/page.tsx
client/src/app/not-found.tsx
client/src/lib/types.ts
client/src/lib/config.ts
client/src/lib/api.ts
client/src/lib/server-api.ts
client/src/lib/firebase.ts
client/src/lib/authErrors.ts
client/src/context/AuthContext.tsx
client/src/components/Navbar.tsx
client/src/components/Footer.tsx
client/src/components/Spinner.tsx
client/src/components/Alert.tsx
client/src/components/EmptyState.tsx
client/src/components/SchemeCard.tsx
```

**Check it runs**

```bash
cd client && npm install
cp .env.example .env.local        # Firebase web config + NEXT_PUBLIC_API_BASE_URL
npm run dev                       # http://localhost:3000 — home page with three schemes
npm run build                     # must pass before you push
```

Set `CLIENT_ORIGIN=http://localhost:3000` in `server/.env` and restart the server.

**Understand before you push**

- Why `lib/firebase.ts` initialises Firebase **lazily** inside a function instead of at module
  scope. (The root layout renders on the server during prerendering; calling `getAuth()` there
  crashes the build because there's no browser.) This is a real bug that was hit and fixed — it's a
  good story for "tell me about a problem you debugged."
- Why the JWT goes in a **cookie** rather than `localStorage`. (Middleware runs on the server and
  can't read `localStorage`.)
- Why `signInWithEmail` awaits the token exchange before the page navigates. (Otherwise the cookie
  isn't set yet and middleware bounces you straight back to `/login`.)
- What `'use client'` actually does, and why `page.tsx` doesn't have it.

```bash
git add . && git commit -m "feat(client): Next.js App Router shell with auth context"
git push
```

---

## Day 6 — Public scheme pages and auth screens

**Copy these files**

```
client/src/app/schemes/page.tsx
client/src/app/schemes/[id]/page.tsx
client/src/components/SchemeFilters.tsx
client/src/app/login/page.tsx
client/src/app/register/page.tsx
```

Turn on Email/Password and Google sign-in in the Firebase console before testing.

**Check it runs**

- `/schemes` lists nine schemes; search, category, sort and pagination all change the URL.
- Copy a filtered URL into a new tab — the same filtered results load. That's the point of SSR.
- Register an account, then sign out and back in.
- `npm run build` passes.

**Understand before you push**

- `/schemes` is a Server Component that reads `searchParams`. Why is that better than fetching in a
  `useEffect` and filtering client-side? (Shareable URLs, indexable pages, no spinner, and the
  filtering happens in Mongo rather than in the browser.)
- Why `fetchPublic` uses `cache: 'no-store'`, and what would break at build time without it.
- What `generateMetadata` on the detail page does that a static `<title>` cannot.
- `SchemeFilters` is a client component that only rewrites the URL. Why doesn't it hold the results?

```bash
git add . && git commit -m "feat(schemes): server-rendered registry with search, filters and pagination"
git push
```

---

## Day 7 — Protected area, CI and docs

**Copy these files**

```
client/src/middleware.ts
client/src/components/StatusStamp.tsx
client/src/components/ApplyForm.tsx
client/src/app/apply/[schemeId]/page.tsx
client/src/app/dashboard/layout.tsx
client/src/app/dashboard/page.tsx
client/src/app/dashboard/applications/page.tsx
client/src/app/dashboard/review/page.tsx
client/src/app/dashboard/schemes/page.tsx
.github/workflows/ci.yml
README.md                          ← replace the Day 1 stub with the full version
docs/
```

Make yourself an admin:

```bash
cd server && npm run seed -- your@email.com
```

Then sign out and back in so the new role is in your token.

**Check it runs**

- Signed out, open `/dashboard` → redirected to `/login`.
- Sign in, submit an application, see it in **My applications**, withdraw it.
- As admin: review queue, record a decision, add and edit a scheme.
- `npm run build` passes in `client`.

**Understand before you push**

- The three routing guards and which one is actually security:
  1. `middleware.ts` at the edge — checks only that the cookie **exists**. It cannot verify the
     signature, because the JWT secret belongs on the API server, not in the edge bundle.
  2. The client-side admin redirect — the role lives inside the signed token, so middleware can't
     see it.
  3. `verifyToken` / `verifyAdmin` on Express — **this is the real gate.** The other two are UX.
- Why the dashboard pages are client components while `/schemes` is server-rendered.

```bash
git add . && git commit -m "feat(dashboard): applicant and reviewer screens, CI and docs"
git push
```

---

## After Day 7 — deploy

**API → Render.** Root directory `server`, build `npm install`, start `npm start`. Add every
variable from `.env.example`.

**Client → Vercel.** Root directory `client`. Add the `NEXT_PUBLIC_*` variables, and point
`NEXT_PUBLIC_API_BASE_URL` at the Render URL — the Next.js server uses it during SSR as well as the
browser, so `localhost` will not work.

Then set `CLIENT_ORIGIN` on Render to the Vercel URL, take a screenshot of the home page into
`docs/screenshot-home.png`, and put both live links at the top of the README and on your CV.

---

## Make it yours

Before this goes on a CV, change something real. Suggestions, easiest first:

1. **Add a scheme you know.** You understand certification schemes — add one the seed file misses,
   with accurate requirements.
2. **Add a status filter to My applications.** The API already accepts `?status=`; the UI doesn't
   use it yet. Small, self-contained, entirely yours.
3. **Add a `reviewedAt` column to the review queue table.** The field already exists on the model.
4. **Write one test.** Even a single Vitest test on the fee-snapshot behaviour is worth mentioning,
   and the README lists "no test suite" as a known gap.

Doing one of these means that when someone asks "what part did you write?", you have a straight
answer.
