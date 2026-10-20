import Link from 'next/link';
import type { Scheme } from '@/lib/types';

export function SchemeCard({ scheme }: { scheme: Scheme }) {
  return (
    <article className="card group flex flex-col transition hover:-translate-y-0.5 hover:border-seal/40">
      {/* Certificate header plate: the code is the thing auditors actually quote. */}
      <header className="flex items-baseline justify-between gap-3 px-5 pt-5">
        <span className="plate">{scheme.code}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate2">
          {scheme.category}
        </span>
      </header>

      <div className="px-5 pb-5 pt-4">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink">
          <Link href={`/schemes/${scheme._id}`} className="hover:text-seal">
            {scheme.name}
          </Link>
        </h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-slate2">
          {scheme.standardBody}
        </p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate2">{scheme.summary}</p>
      </div>

      <div className="rule-perf mt-auto flex items-center justify-between px-5 py-3">
        <dl className="flex gap-5 font-mono text-[11px] text-slate2">
          <div>
            <dt className="uppercase tracking-[0.12em] text-slate2/70">Cycle</dt>
            <dd className="text-ink">{scheme.durationMonths} mo</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.12em] text-slate2/70">Fee</dt>
            <dd className="text-ink">${scheme.feeUSD.toLocaleString()}</dd>
          </div>
        </dl>
        <Link
          href={`/schemes/${scheme._id}`}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-seal group-hover:underline"
        >
          Open →
        </Link>
      </div>
    </article>
  );
}
