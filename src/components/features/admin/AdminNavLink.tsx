'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdminNavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

/**
 * AdminNavLink
 *
 * Client component that renders a sidebar navigation link with active-state
 * highlighting. Uses usePathname to detect the current route.
 *
 * Active detection:
 * - Exact match for /admin (dashboard root)
 * - Prefix match for all other sections (/admin/users, /admin/payments, etc.)
 */
export function AdminNavLink({ href, icon: Icon, children }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150',
        isActive
          ? 'bg-primary/15 text-primary'
          : 'text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </Link>
  );
}
