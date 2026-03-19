'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MobileSidebarProps {
  children: React.ReactNode;
}

/**
 * MobileSidebar
 *
 * Wraps sidebar navigation content in a Sheet drawer for mobile screens.
 * Automatically closes when the route changes (user tapped a link).
 * Visible only below the `md` breakpoint — the trigger button is hidden on desktop.
 */
export function MobileSidebar({ children }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sheet on navigation (pathname change)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 p-0 bg-sidebar border-sidebar-border"
      >
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
