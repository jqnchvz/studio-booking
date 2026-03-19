/**
 * Domain utility functions for subdomain routing.
 *
 * All subdomain logic is driven by the APP_DOMAIN env var:
 *   - Dev:  APP_DOMAIN=localhost:3000  → slug.localhost:3000
 *   - Prod: APP_DOMAIN=reservapp.com  → slug.reservapp.com
 */

export const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'mail', 'ftp',
  'staging', 'dev', 'test', 'beta', 'status',
  'help', 'support', 'docs', 'blog', 'cdn',
  'static', 'assets', 'media', 'images',
] as const;

/**
 * Returns the root domain from APP_DOMAIN env var (e.g., 'reservapp.com' or 'localhost:3000').
 */
export function getAppDomain(): string {
  const domain = process.env.APP_DOMAIN;
  if (!domain) {
    throw new Error('APP_DOMAIN environment variable is not set');
  }
  return domain;
}

/**
 * Whether the current APP_DOMAIN is a localhost environment.
 */
function isLocalhost(domain: string): boolean {
  return domain.startsWith('localhost');
}

/**
 * Returns the protocol based on the domain (http for localhost, https for production).
 */
function getProtocol(domain: string): string {
  return isLocalhost(domain) ? 'http' : 'https';
}

/**
 * Constructs a full URL for the main domain.
 * E.g., 'https://reservapp.com' or 'http://localhost:3000'
 */
export function getMainDomainUrl(): string {
  const domain = getAppDomain();
  return `${getProtocol(domain)}://${domain}`;
}

/**
 * Constructs a full URL for a subdomain.
 * E.g., getSubdomainUrl('pilates') → 'https://pilates.reservapp.com'
 *        getSubdomainUrl('pilates') → 'http://pilates.localhost:3000' (dev)
 */
export function getSubdomainUrl(slug: string): string {
  const domain = getAppDomain();
  return `${getProtocol(domain)}://${slug}.${domain}`;
}

/**
 * Extracts the subdomain from a Host header value.
 * Returns null if no subdomain is present (i.e., the host IS the main domain).
 *
 * Examples:
 *   'pilates-studio.reservapp.com'   → 'pilates-studio'
 *   'reservapp.com'                  → null
 *   'www.reservapp.com'              → 'www'
 *   'pilates-studio.localhost:3000'  → 'pilates-studio'
 *   'localhost:3000'                 → null
 *   'localhost'                      → null
 */
export function extractSubdomain(host: string): string | null {
  const domain = getAppDomain();

  // Host must end with the app domain to be relevant
  if (!host.endsWith(domain)) {
    return null;
  }

  // Strip the app domain from the host to get the prefix
  const prefix = host.slice(0, -domain.length);

  // No prefix means we're on the main domain
  if (!prefix) {
    return null;
  }

  // Prefix should end with a dot (e.g., 'pilates-studio.')
  if (!prefix.endsWith('.')) {
    return null;
  }

  // Remove trailing dot to get the subdomain
  const subdomain = prefix.slice(0, -1);

  // Subdomain must not be empty and must not contain additional dots
  // (we only support single-level subdomains)
  if (!subdomain || subdomain.includes('.')) {
    return null;
  }

  return subdomain;
}

/**
 * Returns true if the given subdomain is reserved and should not be used by tenants.
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(
    subdomain.toLowerCase() as (typeof RESERVED_SUBDOMAINS)[number],
  );
}

/**
 * Returns true if the host is the main domain (no subdomain).
 */
export function isMainDomain(host: string): boolean {
  return extractSubdomain(host) === null;
}
