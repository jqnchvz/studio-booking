import Link from 'next/link';
import type { Metadata } from 'next';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Planes y precios - Reservapp',
  description: 'Elige el plan que mejor se adapte a tu negocio.',
};

const plans = [
  {
    name: 'Básico',
    price: 'Gratis',
    description: '14 días de prueba sin tarjeta de crédito',
    features: [
      'Hasta 2 recursos (salas / equipos)',
      'Reservas ilimitadas',
      'Panel de administración',
      'Notificaciones por email',
    ],
    cta: 'Empezar gratis',
    href: '/register/business?plan=basico',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29.990',
    period: '/ mes',
    description: 'Todo lo que necesitas para crecer',
    features: [
      'Recursos ilimitados',
      'Suscripciones de clientes',
      'Cobros con MercadoPago',
      'Reportes y estadísticas',
      'Soporte prioritario',
    ],
    cta: 'Contratar Pro',
    href: '/register/business?plan=pro',
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 90% 70% at 50% -10%, oklch(68% 0.16 68 / 0.10), transparent)',
      }}
    >
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Planes para tu negocio
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Empieza gratis y crece con nosotros. Sin sorpresas, sin letras
            chicas.
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
                plan.highlighted
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Más popular
                </span>
              )}

              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  plan.highlighted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-border hover:bg-muted'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-muted-foreground">
          ¿Preguntas?{' '}
          <a
            href="mailto:hola@reservapp.cl"
            className="text-primary hover:underline"
          >
            Contáctanos
          </a>
          . Puedes cambiar de plan en cualquier momento.
        </p>
      </div>
    </div>
  );
}
