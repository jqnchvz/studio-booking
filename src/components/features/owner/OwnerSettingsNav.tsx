'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const SETTINGS_TABS = [
  { label: 'Perfil', href: '/owner/settings' },
  { label: 'Pagos', href: '/owner/settings/payment' },
];

export function OwnerSettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border overflow-x-auto">
      {SETTINGS_TABS.map((tab) => {
        const isActive =
          tab.href === '/owner/settings'
            ? pathname === '/owner/settings'
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
