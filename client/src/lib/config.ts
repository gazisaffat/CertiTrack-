export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

/**
 * The app JWT lives in a cookie rather than localStorage so Next.js middleware
 * can see it and redirect signed-out visitors before /dashboard renders.
 * It is not httpOnly — the client needs to attach it as a bearer header — so the
 * cookie is a routing hint, never the authorisation itself. Every protected
 * endpoint still verifies the signature server-side.
 */
export const TOKEN_COOKIE = 'certitrack_token';
