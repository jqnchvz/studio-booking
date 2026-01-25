import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from './src/lib/auth/session';
import { db } from './src/lib/db';

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

  // Check subscription status for reservation routes
  if (pathname.startsWith('/reservations')) {
    try {
      const subscription = await db.subscription.findUnique({
        where: { userId: payload.userId },
        select: { status: true },
      });

      // Block access if subscription is suspended
      if (subscription && subscription.status === 'suspended') {
        const paymentRequiredUrl = new URL('/dashboard/subscription', request.url);
        paymentRequiredUrl.searchParams.set('reason', 'suspended');
        return NextResponse.redirect(paymentRequiredUrl);
      }

      // Also block if user has no subscription at all
      if (!subscription) {
        const subscribeUrl = new URL('/dashboard/subscribe', request.url);
        return NextResponse.redirect(subscribeUrl);
      }
    } catch (error) {
      console.error('Error checking subscription status in middleware:', error);
      // On error, allow through (fail open rather than fail closed)
      return NextResponse.next();
    }
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
