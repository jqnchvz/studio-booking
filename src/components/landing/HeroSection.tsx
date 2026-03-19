import Link from 'next/link';
import { ArrowRight, CalendarCheck, Star, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
        {/* Social proof pill */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
          <Star className="h-3 w-3 fill-primary" />
          <span>La plataforma que conecta negocios con sus clientes</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Reservas y{' '}
          <span className="text-primary">suscripciones</span>{' '}
          en un solo lugar
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Para negocios: gestiona recursos, planes y cobros automáticos.
          Para usuarios: reserva en cualquier negocio con una sola cuenta.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="text-base px-8" asChild>
            <Link href="/register/business">
              Registra tu negocio
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8" asChild>
            <a href="#para-usuarios">
              <UserPlus className="h-4 w-4 mr-1" />
              Soy usuario
            </a>
          </Button>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4 text-success" />
            <span>Sin contrato de permanencia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4 text-success" />
            <span>Pagos con MercadoPago</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4 text-success" />
            <span>Configuración en minutos</span>
          </div>
        </div>
      </div>
    </section>
  );
}
