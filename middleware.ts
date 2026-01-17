import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from './src/lib/auth/session';

export function middleware(request: NextRequest) {
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

  // Check authentication for protected routes
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
