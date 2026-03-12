import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-base">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <span>Reservapp</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              La plataforma de reservas y suscripciones para negocios locales en Chile.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Características
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Precios
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Registrarse
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {year} Reservapp. Todos los derechos reservados.</p>
          <p>Hecho con ❤️ para negocios locales en Chile</p>
        </div>
      </div>
    </footer>
  );
}
