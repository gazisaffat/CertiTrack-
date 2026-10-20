'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * The scheme list itself is a Server Component — this bar only rewrites the URL.
 * Navigating re-runs the server fetch, so filtering is real SSR rather than a
 * client-side array filter, and any filtered view is shareable and indexable.
 */
export function SchemeFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get('search') ?? '';
  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'name';

  const [draft, setDraft] = useState(search);
  useEffect(() => setDraft(search), [search]);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!('page' in patch)) next.delete('page'); // any filter change resets pagination

    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <div className="flex flex-1 gap-2">
        <input
          className="field"
          placeholder="Search by name, code or standard body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update({ search: draft });
          }}
          aria-label="Search schemes"
        />
        <button type="button" className="btn-primary" onClick={() => update({ search: draft })}>
          Search
        </button>
      </div>

      <select
        className="field sm:w-52"
        value={category}
        onChange={(e) => update({ category: e.target.value })}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        className="field sm:w-44"
        value={sort}
        onChange={(e) => update({ sort: e.target.value })}
        aria-label="Sort schemes"
      >
        <option value="name">Name A–Z</option>
        <option value="fee-asc">Fee: low to high</option>
        <option value="fee-desc">Fee: high to low</option>
        <option value="newest">Recently added</option>
      </select>
    </div>
  );
}
