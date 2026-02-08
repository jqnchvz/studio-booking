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

  // Check admin access for admin routes
  if (pathname.startsWith('/admin')) {
    try {
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: { isAdmin: true },
      });

      if (!user || !user.isAdmin) {
        // Non-admin users are redirected to their dashboard
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }

      // Admin user - allow access
      return NextResponse.next();
    } catch (error) {
      console.error('Error checking admin status in middleware:', error);
      // On error, deny access to admin routes
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Check subscription status for reservation routes
  if (pathname.startsWith('/reservations')) {
    try {
      const subscription = await db.subscription.findUnique({
        where: { userId: payload.userId },
        select: { status: true, gracePeriodEnd: true },
      });

      // Block if user has no subscription at all
      if (!subscription) {
        const subscribeUrl = new URL('/dashboard/subscribe', request.url);
        return NextResponse.redirect(subscribeUrl);
      }

      // Block access if subscription is suspended
      if (subscription.status === 'suspended') {
        const paymentRequiredUrl = new URL('/dashboard/subscription', request.url);
        paymentRequiredUrl.searchParams.set('reason', 'suspended');
        return NextResponse.redirect(paymentRequiredUrl);
      }

      // Check grace period for past_due subscriptions
      if (subscription.status === 'past_due') {
        const now = new Date();
        const graceExpired =
          !subscription.gracePeriodEnd || subscription.gracePeriodEnd <= now;

        if (graceExpired) {
          const paymentRequiredUrl = new URL('/dashboard/subscription', request.url);
          paymentRequiredUrl.searchParams.set('reason', 'grace_expired');
          return NextResponse.redirect(paymentRequiredUrl);
        }
        // Grace period still active — allow access
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
  // Force Node.js runtime to allow Prisma database access
  // Edge Runtime doesn't support Node.js APIs required by pg Pool
  runtime: 'nodejs',
};
