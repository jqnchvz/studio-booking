import Link from 'next/link';
import { CalendarDays, CreditCard, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessLandingPage({ params }: BusinessPageProps) {
  const { slug } = await params;

  const org = await db.organization.findUnique({
    where: { slug, status: 'active' },
    select: {
      id: true,
      name: true,
      settings: { select: { businessType: true } },
      _count: {
        select: {
          resources: { where: { isActive: true } },
          plans: { where: { isActive: true } },
        },
      },
    },
  });

  if (!org) notFound();

  const resourceCount = org._count.resources;
  const planCount = org._count.plans;
  const base = `/b/${slug}`;

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {org.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Reserva tu espacio de forma rápida y segura. Explora nuestros recursos
            disponibles y elige el plan que mejor se adapte a ti.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {resourceCount > 0 && (
              <Button size="lg" className="text-base" asChild>
                <Link href={`${base}/resources`}>
                  Ver recursos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
            {planCount > 0 && (
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link href={`${base}/plans`}>Ver planes</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Info cards */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href={`${base}/resources`}
            className="group rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-semibold text-base mb-1">Recursos</h2>
            <p className="text-sm text-muted-foreground">
              {resourceCount > 0
                ? `${resourceCount} ${resourceCount === 1 ? 'recurso disponible' : 'recursos disponibles'}`
                : 'Sin recursos disponibles aún'}
            </p>
          </Link>

          <Link
            href={`${base}/plans`}
            className="group rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-semibold text-base mb-1">Planes</h2>
            <p className="text-sm text-muted-foreground">
              {planCount > 0
                ? `${planCount} ${planCount === 1 ? 'plan disponible' : 'planes disponibles'}`
                : 'Sin planes disponibles aún'}
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
