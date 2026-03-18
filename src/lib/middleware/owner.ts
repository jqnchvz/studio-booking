import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db';

export interface OwnerUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string; // the org they own
}

type RequireOwnerResult =
  | { success: true; user: OwnerUser }
  | { success: false; response: NextResponse };

/**
 * Guard helper for owner-only API routes.
 * Checks cookie → verifies JWT → fetches user from DB → checks role
 * → resolves owned organization.
 *
 * Usage in an API route:
 *   const result = await requireOwner(request);
 *   if (!result.success) return result.response;
 *   const { user } = result; // user.organizationId is the org to scope queries to
 */
export async function requireOwner(request: NextRequest): Promise<RequireOwnerResult> {
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(sessionCookie.value);
  if (!payload) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      ),
    };
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ownedOrganizations: { select: { id: true }, take: 1 },
    },
  });

  if (!user) {
    return {
      success: false,
      response: NextResponse.json({ error: 'User not found' }, { status: 404 }),
    };
  }

  if (user.role !== 'owner') {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Owner access required' },
        { status: 403 }
      ),
    };
  }

  const org = user.ownedOrganizations[0];
  if (!org) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'No organization found for this owner' },
        { status: 404 }
      ),
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: org.id,
    },
  };
}
