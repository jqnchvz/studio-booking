/**
 * Centralized URL helpers for email templates.
 *
 * Dashboard links (reservations, subscriptions) always use the main domain.
 * Business-specific links use the subdomain when org context is available.
 */

/**
 * Returns the main application URL for email links.
 * Tries APP_DOMAIN-based URL first, falls back to NEXT_PUBLIC_APP_URL.
 */
export function getAppUrl(): string {
  // Try APP_DOMAIN (runtime, preferred for subdomain-aware environments)
  const appDomain = process.env.APP_DOMAIN;
  if (appDomain) {
    const protocol = appDomain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${appDomain}`;
  }

  // Fallback to NEXT_PUBLIC_APP_URL (available at build time and runtime)
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Returns the subdomain URL for a specific business.
 * Used in org-scoped emails to link users to the business's public pages.
 */
export function getBusinessUrl(slug: string): string {
  const appDomain = process.env.APP_DOMAIN;
  if (appDomain) {
    const protocol = appDomain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${slug}.${appDomain}`;
  }

  // Fallback: use main domain with /b/slug path (path-based tenant access)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/b/${slug}`;
}
