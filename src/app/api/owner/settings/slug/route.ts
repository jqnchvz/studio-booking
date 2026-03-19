import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';
import { SlugSchema } from '@/lib/validations/slug';
import { getSubdomainUrl } from '@/lib/utils/domain';

/**
 * GET /api/owner/settings/slug
 * Returns the current organization slug and subdomain URL.
 */
export async function GET(request: NextRequest) {
  const result = await requireOwner(request);
  if (!result.success) return result.response;

  const org = await db.organization.findUnique({
    where: { id: result.user.organizationId },
    select: { slug: true },
  });

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  return NextResponse.json({
    slug: org.slug,
    subdomainUrl: getSubdomainUrl(org.slug),
  });
}

/**
 * PATCH /api/owner/settings/slug
 * Updates the organization slug (subdomain).
 */
export async function PATCH(request: NextRequest) {
  const result = await requireOwner(request);
  if (!result.success) return result.response;

  const body = await request.json();
  const parsed = SlugSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Subdominio inválido', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { slug } = parsed.data;

  // Check uniqueness — another org might already have this slug
  const existing = await db.organization.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== result.user.organizationId) {
    return NextResponse.json(
      { error: 'Este subdominio ya está en uso' },
      { status: 409 },
    );
  }

  // Update slug
  await db.organization.update({
    where: { id: result.user.organizationId },
    data: { slug },
  });

  return NextResponse.json({
    slug,
    subdomainUrl: getSubdomainUrl(slug),
    message: 'Subdominio actualizado exitosamente',
  });
}
