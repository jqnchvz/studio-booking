import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { formatCLP } from '@/lib/utils/format';

interface PlansPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata = { title: 'Planes' };

export default async function TenantPlansPage({ params }: PlansPageProps) {
  const { slug } = await params;

  const org = await db.organization.findUnique({
    where: { slug, status: 'active' },
    select: {
      id: true,
      name: true,
      plans: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          interval: true,
          features: true,
        },
      },
    },
  });

  if (!org) notFound();

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Planes</h1>
          <p className="text-muted-foreground">
            Suscríbete a un plan de {org.name} para acceder a recursos y reservar.
          </p>
        </div>

        {org.plans.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No hay planes disponibles en este momento.
          </p>
        ) : (
          <div
            className={`grid gap-6 ${
              org.plans.length === 1
                ? 'max-w-sm mx-auto'
                : org.plans.length === 2
                  ? 'sm:grid-cols-2 max-w-3xl mx-auto'
                  : 'sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {org.plans.map((plan) => {
              const features = Array.isArray(plan.features)
                ? (plan.features as string[])
                : [];

              return (
                <div
                  key={plan.id}
                  className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4"
                >
                  <div>
                    <h2 className="text-lg font-bold">{plan.name}</h2>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">{formatCLP(plan.price)}</span>
                    <span className="text-muted-foreground text-sm mb-0.5">
                      /{plan.interval === 'yearly' ? 'año' : 'mes'}
                    </span>
                  </div>

                  {features.length > 0 && (
                    <ul className="space-y-2 flex-1">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button className="w-full" asChild>
                    <Link href="/register">Suscribirse</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
