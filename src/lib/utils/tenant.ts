import { db } from '@/lib/db';

/**
 * Fetches an active organization by slug, including settings.
 * Used by Server Components in the /t/[slug] route group.
 */
export async function getTenantOrg(slug: string) {
  return db.organization.findUnique({
    where: { slug, status: 'active' },
    include: { settings: true },
  });
}

/**
 * Reads organization context set by middleware via request headers.
 * Used by API routes that need tenant context on subdomain requests.
 */
export function getOrgFromHeaders(
  headers: Headers,
): { id: string; slug: string; name: string } | null {
  const id = headers.get('x-org-id');
  if (!id) return null;
  return {
    id,
    slug: headers.get('x-org-slug') || '',
    name: headers.get('x-org-name') || '',
  };
}

/** Spanish day names indexed by dayOfWeek (0 = Sunday). */
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Formats a dayOfWeek number (0-6) to a short Spanish name.
 */
export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] || '';
}
