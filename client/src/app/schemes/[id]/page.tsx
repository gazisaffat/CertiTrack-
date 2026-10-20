import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { fetchPublic } from '@/lib/server-api';
import { Footer } from '@/components/Footer';
import type { Scheme } from '@/lib/types';

type Props = { params: { id: string } };

/** Per-scheme title and description, so a shared link previews properly. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const scheme = await fetchPublic<Scheme>(`/api/schemes/${params.id}`);
  if (!scheme) return { title: 'Scheme not found' };

  return {
    title: `${scheme.code} — ${scheme.name}`,
    description: scheme.summary
  };
}

export default async function SchemeDetailsPage({ params }: Props) {
  const scheme = await fetchPublic<Scheme>(`/api/schemes/${params.id}`);
  if (!scheme) notFound();

  return (
    <>
      <article className="mx-auto max-w-4xl px-5 py-14">
        <Link
          href="/schemes"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate2 hover:text-ink"
        >
          ← All schemes
        </Link>

        <header className="mt-6 flex flex-wrap items-center gap-3">
          <span className="plate">{scheme.code}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate2">
            {scheme.category}
          </span>
        </header>

        <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
          {scheme.name}
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate2">
          Issued under {scheme.standardBody}
        </p>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate2">{scheme.summary}</p>

        <dl className="mt-8 grid gap-px border border-ink/12 bg-ink/10 sm:grid-cols-3">
          <div className="bg-white px-5 py-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate2">
              Certification cycle
            </dt>
            <dd className="mt-1 font-display text-xl font-semibold text-ink">
              {scheme.durationMonths} months
            </dd>
          </div>
          <div className="bg-white px-5 py-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate2">
              Indicative fee
            </dt>
            <dd className="mt-1 font-display text-xl font-semibold text-ink">
              ${scheme.feeUSD.toLocaleString()}
            </dd>
          </div>
          <div className="bg-white px-5 py-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate2">
              Documents required
            </dt>
            <dd className="mt-1 font-display text-xl font-semibold text-ink">
              {scheme.requirements.length}
            </dd>
          </div>
        </dl>

        {scheme.description && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-ink">What it covers</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate2">
              {scheme.description}
            </p>
          </section>
        )}

        {scheme.requirements.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-ink">
              Bring these to the audit
            </h2>
            <ul className="mt-4 max-w-2xl divide-y divide-ink/10 border-y border-ink/10">
              {scheme.requirements.map((requirement, index) => (
                <li key={requirement} className="flex gap-4 py-3">
                  <span className="font-mono text-[11px] text-seal">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm leading-relaxed text-slate2">{requirement}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          {/* Middleware sends signed-out visitors from /apply to /login and back. */}
          <Link href={`/apply/${scheme._id}`} className="btn-primary">
            Apply for {scheme.code}
          </Link>
          <Link href="/schemes" className="btn-ghost">
            Compare other schemes
          </Link>
        </div>
      </article>

      <Footer />
    </>
  );
}
