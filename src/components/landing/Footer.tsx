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
          <div className="flex flex-col sm:flex-row gap-8">
            <nav className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground text-xs uppercase tracking-wider">Negocios</p>
              <a href="#para-negocios" className="block hover:text-foreground transition-colors">
                Características
              </a>
              <a href="#pricing" className="block hover:text-foreground transition-colors">
                Precios
              </a>
              <Link href="/register/business" className="block hover:text-foreground transition-colors">
                Registrar negocio
              </Link>
            </nav>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground text-xs uppercase tracking-wider">Usuarios</p>
              <a href="#para-usuarios" className="block hover:text-foreground transition-colors">
                Para usuarios
              </a>
              <Link href="/register" className="block hover:text-foreground transition-colors">
                Crear cuenta
              </Link>
              <Link href="/login" className="block hover:text-foreground transition-colors">
                Iniciar sesión
              </Link>
            </nav>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground text-xs uppercase tracking-wider">Soporte</p>
              <a href="#faq" className="block hover:text-foreground transition-colors">
                FAQ
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {year} Reservapp. Todos los derechos reservados.</p>
          <p>Hecho con ❤️ para negocios locales en Chile</p>
        </div>
      </div>
    </footer>
  );
}
