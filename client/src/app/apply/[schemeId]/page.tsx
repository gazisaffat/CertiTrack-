import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

import { fetchPublic } from '@/lib/server-api';
import { ApplyForm } from '@/components/ApplyForm';
import type { Scheme } from '@/lib/types';

type Props = { params: { schemeId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const scheme = await fetchPublic<Scheme>(`/api/schemes/${params.schemeId}`);
  return { title: scheme ? `Apply for ${scheme.code}` : 'Apply' };
}

/**
 * The scheme is fetched on the server (public data), the form is a client
 * component (needs the session). Middleware has already ensured a session
 * cookie exists before this renders.
 */
export default async function ApplyPage({ params }: Props) {
  const scheme = await fetchPublic<Scheme>(`/api/schemes/${params.schemeId}`);
  if (!scheme) notFound();

  return (
    <section className="mx-auto max-w-2xl px-5 py-14">
      <Link
        href={`/schemes/${scheme._id}`}
        className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate2 hover:text-ink"
      >
        ← {scheme.code}
      </Link>

      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink">
        Apply for {scheme.name}
      </h1>

      <ApplyForm scheme={scheme} />
    </section>
  );
}
