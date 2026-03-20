'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TenantNavbarProps {
  orgName: string;
  /** Prefix for nav links. Defaults to '' (subdomain mode). Use '/b/slug' for path-based mode. */
  basePath?: string;
}

const navLinks = [
  { label: 'Recursos', href: '/resources' },
  { label: 'Planes', href: '/plans' },
  { label: 'Reservar', href: '/book' },
];

export function TenantNavbar({ orgName, basePath = '' }: TenantNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Business name */}
        <Link href={basePath || '/'} className="font-bold text-lg truncate max-w-[200px]">
          {orgName}
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={`${basePath}${link.href}`} className="hover:text-foreground transition-colors">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={`${basePath}${link.href}`}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
