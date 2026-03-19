import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const USER_FEATURES = [
  'Registro gratuito',
  'Reservas en cualquier negocio de la plataforma',
  'Historial de reservas centralizado',
  'Pagos seguros con MercadoPago',
];

export function ForUsersSection() {
  return (
    <section id="para-usuarios" className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Para Usuarios</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Una cuenta, todos los espacios</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Crea tu cuenta una vez y reserva en cualquier negocio de la plataforma.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 max-w-2xl mx-auto">
          <ul className="space-y-4 mb-8">
            {USER_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm sm:text-base">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="text-base flex-1" asChild>
              <Link href="/register">
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base flex-1" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
