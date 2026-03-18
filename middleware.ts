import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from './src/lib/auth/session';

/**
 * Must be Node.js runtime to support jsonwebtoken (uses Node crypto APIs).
 * This top-level export is what Next.js actually reads — placing `runtime`
 * inside `export const config` is silently ignored and was the root cause
 * of this middleware never running (RES-81).
 */
export const runtime = 'nodejs';

// Auth-only paths: authenticated users should be redirected away to /dashboard
const AUTH_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  // Verify token once — used for both auth-page and protected-route checks
  const payload = sessionCookie ? verifyToken(sessionCookie.value) : null;

  // Redirect authenticated users away from auth pages (e.g. /login → /dashboard)
  if (isAuthPath) {
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    // Clear stale cookie if it exists but is invalid
    if (sessionCookie) {
      response.cookies.delete('session');
    }
    return response;
  }

  // Check admin access for admin routes using JWT claim (no DB query needed)
  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check owner access for owner portal routes
  if (pathname.startsWith('/owner') && payload.role !== 'owner') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow authenticated request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes
    '/dashboard/:path*',
    '/reservations/:path*',
    '/subscription/:path*',
    '/admin/:path*',
    '/owner/:path*',
    '/profile/:path*',
    // Auth routes (so authenticated users get redirected away)
    '/login',
    '/register',
    '/verify-email/:path*',
    '/forgot-password',
    '/reset-password/:path*',
  ],
};
