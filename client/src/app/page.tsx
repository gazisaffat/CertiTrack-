import Link from 'next/link';

import { fetchPublic } from '@/lib/server-api';
import { SchemeCard } from '@/components/SchemeCard';
import { Footer } from '@/components/Footer';
import type { Paged, Scheme } from '@/lib/types';

const STEPS = [
  {
    code: '01',
    title: 'Pick a scheme',
    body: 'Compare cycle length, audit fee and the documents each standard body asks for before you commit.'
  },
  {
    code: '02',
    title: 'Submit the application',
    body: 'One form per site. The fee is frozen at the moment you submit, so a later price change never rewrites your record.'
  },
  {
    code: '03',
    title: 'Track the review',
    body: 'Every status change is stamped with the reviewer and the date, and stays visible to you until the file closes.'
  }
];

const CODES = ['GOTS', 'GRS', 'OCS', 'RCS', 'ISO14001', 'SA8000', 'BSCI', 'RWS'];

/** Server Component — the featured schemes are in the HTML the browser receives. */
export default async function HomePage() {
  const data = await fetchPublic<Paged<Scheme>>('/api/schemes?limit=3&sort=name');
  const schemes = data?.items ?? [];

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate2">
          Certification application registry
        </p>

        <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl">
          Every certification file,
          <br />
          <span className="text-seal">one status line.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-slate2">
          Factories run GOTS, GRS, SA8000 and ISO audits on separate spreadsheets and separate
          inboxes. CertiTrack keeps the scheme requirements, the application and the reviewer’s
          decision in one place.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/schemes" className="btn-primary">
            Browse schemes
          </Link>
          <Link href="/register" className="btn-ghost">
            Create an account
          </Link>
        </div>

        {/* A row of plates, the way scheme codes appear along the top of a real certificate. */}
        <div className="mt-14 flex flex-wrap items-center gap-2 border-t border-dashed border-ink/25 pt-6">
          <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate2/70">
            Covering
          </span>
          {CODES.map((code) => (
            <span key={code} className="plate">
              {code}
            </span>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/12 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.code}>
              <span className="font-mono text-[11px] tracking-[0.2em] text-seal">{step.code}</span>
              <h2 className="mt-3 font-display text-xl font-semibold text-ink">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate2">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Start with these
          </h2>
          <Link
            href="/schemes"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-seal hover:underline"
          >
            All schemes →
          </Link>
        </div>

        {schemes.length === 0 ? (
          <p className="mt-8 border border-dashed border-ink/25 px-5 py-10 text-center text-sm text-slate2">
            The registry API is not reachable right now. Start the server and reload.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schemes.map((scheme) => (
              <SchemeCard key={scheme._id} scheme={scheme} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
