import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Negocio no encontrado — Reservapp',
};

export default function TenantNotFoundPage() {
  // Use NEXT_PUBLIC_APP_URL (available at build time) instead of getMainDomainUrl()
  // which depends on APP_DOMAIN (runtime-only) and breaks static prerendering.
  const mainUrl = process.env.NEXT_PUBLIC_APP_URL || '/';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <CalendarCheck className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Negocio no encontrado</h1>
        <p className="text-muted-foreground">
          El negocio que buscas no existe o no está disponible en este momento.
          Verifica la dirección e intenta nuevamente.
        </p>
        <Button asChild>
          <a href={mainUrl}>Ir a Reservapp</a>
        </Button>
      </div>
    </div>
  );
}
