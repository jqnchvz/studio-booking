'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  LayoutGrid,
  CreditCard,
  DollarSign,
  Receipt,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  dashboard: LayoutDashboard,
  reservations: Calendar,
  clients: Users,
  resources: LayoutGrid,
  plans: CreditCard,
  subscriptions: Receipt,
  payments: DollarSign,
  settings: Settings,
} as const;

type IconKey = keyof typeof iconMap;

interface OwnerNavLinkProps {
  href: string;
  icon: IconKey;
  children: React.ReactNode;
}

export function OwnerNavLink({ href, icon, children }: OwnerNavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === '/owner' ? pathname === '/owner' : pathname.startsWith(href);

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
