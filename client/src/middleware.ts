import { NextResponse, type NextRequest } from 'next/server';

import { TOKEN_COOKIE } from '@/lib/config';

/**
 * Edge-level routing guard. It only checks that a session cookie is present —
 * it does not verify the signature, because the JWT secret belongs on the API
 * server and never in the edge bundle.
 *
 * The point is to stop a signed-out visitor from ever rendering /dashboard and
 * watching it flash before a client-side redirect. Authorisation itself is
 * enforced by verifyToken / verifyAdmin on the Express API, which is the only
 * place that can be trusted.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/apply');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?from=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/apply/:path*', '/login', '/register']
};
