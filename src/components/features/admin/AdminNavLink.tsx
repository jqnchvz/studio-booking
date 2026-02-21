'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  CreditCard,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon map keeps functions server-side-safe: server passes a string key,
// this client component resolves the actual function.
const iconMap = {
  dashboard: LayoutDashboard,
  users: Users,
  payments: DollarSign,
  reservations: Calendar,
  subscriptions: CreditCard,
  settings: Settings,
} as const;

type IconKey = keyof typeof iconMap;

interface AdminNavLinkProps {
  href: string;
  icon: IconKey;
  children: React.ReactNode;
}

/**
 * AdminNavLink
 *
 * Client component that renders a sidebar navigation link with active-state
 * highlighting. Uses usePathname to detect the current route.
 *
 * Accepts an icon key string (not a component) to avoid the RSC constraint
 * of passing functions from Server → Client components.
 *
 * Active detection:
 * - Exact match for /admin (dashboard root)
 * - Prefix match for all other sections (/admin/users, /admin/payments, etc.)
 */
export function AdminNavLink({ href, icon, children }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const Icon = iconMap[icon];

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150',
        isActive
          ? 'bg-sidebar-active/10 text-sidebar-active'
          : 'text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </Link>
  );
}
