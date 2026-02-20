import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from './src/lib/auth/session';

/**
 * Must be Node.js runtime to support jsonwebtoken (uses Node crypto APIs).
 * This top-level export is what Next.js actually reads — placing `runtime`
 * inside `export const config` is silently ignored and was the root cause
 * of this middleware never running (RES-81).
 */
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Allow public routes
  const publicPaths = [
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
  ];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isApiAuth = pathname.startsWith('/api/auth/');

  // Allow access to public paths and auth API routes
  if (isPublicPath || isApiAuth) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const payload = verifyToken(sessionCookie.value);
  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('session');
    return response;
  }

  // Check admin access for admin routes using JWT claim (no DB query needed)
  if (pathname.startsWith('/admin') && !payload.isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow authenticated request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/reservations/:path*',
    '/subscription/:path*',
    '/admin/:path*',
    '/profile/:path*',
  ],
};
