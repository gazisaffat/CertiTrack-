import { API_BASE_URL } from './config';

/**
 * Fetch helper for React Server Components. Public endpoints only — server
 * components never see the user's token, so anything personalised is fetched
 * from a client component instead.
 *
 * `cache: 'no-store'` keeps the registry fresh and keeps the route dynamic, so
 * `next build` does not try to reach the API while building.
 */
export async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error('[ssr] fetch failed:', path, err);
    return null;
  }
}
