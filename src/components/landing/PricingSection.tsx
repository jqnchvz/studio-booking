import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCLP } from '@/lib/utils/format';
import { db } from '@/lib/db';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

async function getPlans(): Promise<Plan[]> {
  try {
    const plans = await db.platformPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: { id: true, name: true, price: true, features: true },
    });
    return plans.map((p) => ({
      ...p,
      features: Array.isArray(p.features) ? (p.features as string[]) : [],
    }));
  } catch {
    return [];
  }
}

export async function PricingSection() {
  const plans = await getPlans();

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Precios</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Planes simples, sin sorpresas</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Planes para dueños de negocios. Elige el que se adapte a tu operación. Cancela cuando quieras.
          </p>
        </div>

        {plans.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay planes disponibles en este momento.</p>
        ) : (
          <div
            className={`grid gap-8 ${
              plans.length === 1
                ? 'max-w-sm mx-auto'
                : plans.length === 2
                  ? 'md:grid-cols-2 max-w-3xl mx-auto'
                  : 'md:grid-cols-3'
            }`}
          >
            {plans.map((plan, index) => {
              const isPopular = index === plans.length - 1 && plans.length > 1;
              const features = Array.isArray(plan.features) ? plan.features : [];

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
                    isPopular
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-border bg-card'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        <Sparkles className="h-3 w-3" />
                        Más popular
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>

                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">{formatCLP(plan.price)}</span>
                    <span className="text-muted-foreground text-sm mb-1">/mes</span>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {features.map((feature: string) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    size="lg"
                    asChild
                  >
                    <Link href={`/register/business?plan=${plan.id}`}>
                      Empezar con {plan.name}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Todos los precios en pesos chilenos (CLP) · IVA incluido · Sin costos ocultos
        </p>
      </div>
    </section>
  );
}
