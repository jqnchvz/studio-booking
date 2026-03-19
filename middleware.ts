import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, getCookieDomain } from './src/lib/auth/session';
import { extractSubdomain, isReservedSubdomain, getMainDomainUrl } from './src/lib/utils/domain';
import { db } from './src/lib/db';

/**
 * Must be Node.js runtime to support jsonwebtoken (uses Node crypto APIs)
 * and Prisma (for tenant resolution).
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

// Protected paths that require authentication on the main domain
const PROTECTED_PATHS = [
  '/dashboard',
  '/reservations',
  '/subscription',
  '/admin',
  '/owner',
  '/profile',
];

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(host);

  // --- SUBDOMAIN HANDLING ---
  if (subdomain) {
    // Reserved subdomains (www, api, admin, etc.) → redirect to main domain
    if (isReservedSubdomain(subdomain)) {
      return NextResponse.redirect(
        new URL(pathname + request.nextUrl.search, getMainDomainUrl()),
      );
    }

    return handleTenantRequest(request, subdomain);
  }

  // --- MAIN DOMAIN HANDLING (existing auth logic) ---
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  // Only process auth/protected routes on the main domain; let everything else through
  if (!isAuthPath && !isProtectedPath) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session');
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
    // Clear stale cookie if it exists but is invalid (must match domain/path)
    if (sessionCookie) {
      const cookieDomain = getCookieDomain();
      response.cookies.delete({
        name: 'session',
        path: '/',
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });
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

/**
 * Handles requests on tenant subdomains (e.g., pilates-studio.reservapp.com).
 * Resolves the organization from DB and rewrites to the /t/[slug] route group.
 */
async function handleTenantRequest(request: NextRequest, subdomain: string) {
  const { pathname } = request.nextUrl;

  // Resolve organization by slug
  const org = await db.organization.findUnique({
    where: { slug: subdomain },
    select: { id: true, slug: true, name: true, status: true },
  });

  // Invalid or inactive org → show not-found page
  if (!org || org.status !== 'active') {
    const url = request.nextUrl.clone();
    url.pathname = '/tenant-not-found';
    return NextResponse.rewrite(url);
  }

  // Rewrite to internal /t/[slug] route group
  const url = request.nextUrl.clone();
  url.pathname = `/t/${subdomain}${pathname === '/' ? '' : pathname}`;

  const response = NextResponse.rewrite(url);

  // Propagate org context via request headers
  response.headers.set('x-org-id', org.id);
  response.headers.set('x-org-slug', org.slug);
  response.headers.set('x-org-name', org.name);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Static assets (.svg, .png, .jpg, .gif, .webp, .ico)
     * - API routes (handled separately, no subdomain rewriting needed)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
