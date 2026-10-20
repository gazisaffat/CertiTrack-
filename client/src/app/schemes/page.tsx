import Link from 'next/link';
import type { Metadata } from 'next';

import { fetchPublic } from '@/lib/server-api';
import { SchemeCard } from '@/components/SchemeCard';
import { SchemeFilters } from '@/components/SchemeFilters';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import type { Paged, Scheme } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Certification schemes',
  description:
    'Search GOTS, GRS, OCS, RCS, ISO 14001, SA8000 and other certification schemes by name, category and fee.'
};

type SearchParams = { search?: string; category?: string; sort?: string; page?: string };

export default async function SchemesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = new URLSearchParams({
    search: searchParams.search ?? '',
    category: searchParams.category ?? '',
    sort: searchParams.sort ?? 'name',
    page: searchParams.page ?? '1',
    limit: '9'
  });

  // Both requests are issued in parallel on the server, so the browser gets one
  // fully-rendered page instead of a spinner plus two waterfalled requests.
  const [data, categories] = await Promise.all([
    fetchPublic<Paged<Scheme>>(`/api/schemes?${query}`),
    fetchPublic<string[]>('/api/schemes/categories')
  ]);

  const pageHref = (n: number) => {
    const next = new URLSearchParams(query);
    next.delete('limit');
    next.set('page', String(n));
    return `/schemes?${next}`;
  };

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Certification schemes
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate2">
          {data
            ? `${data.total} schemes available for application.`
            : 'The registry API is not reachable right now.'}
        </p>

        <SchemeFilters categories={categories ?? []} />

        <div className="mt-8">
          {!data || data.items.length === 0 ? (
            <EmptyState
              title="No schemes match those filters"
              body="Try a broader search term, or clear the category filter to see the full registry."
              actionLabel="Clear filters"
              actionHref="/schemes"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((scheme) => (
                <SchemeCard key={scheme._id} scheme={scheme} />
              ))}
            </div>
          )}
        </div>

        {data && data.pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                aria-current={n === data.page ? 'page' : undefined}
                className={`flex h-9 w-9 items-center justify-center border font-mono text-xs transition ${
                  n === data.page
                    ? 'border-seal bg-seal text-white'
                    : 'border-ink/20 text-slate2 hover:border-ink'
                }`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </section>

      <Footer />
    </>
  );
}
