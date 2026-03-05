import Link from 'next/link';
import { CheckCircle2, Settings, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const nextSteps = [
  {
    icon: Settings,
    title: 'Configura MercadoPago',
    description: 'Conecta tus credenciales de pago para empezar a cobrar',
    href: '/owner/settings/payment',
  },
  {
    icon: Package,
    title: 'Agrega tu primer recurso',
    description: 'Crea salas, equipos o servicios que tus clientes puedan reservar',
    href: '/owner/resources/new',
  },
  {
    icon: Users,
    title: 'Define tus planes',
    description: 'Configura los planes de suscripción para tus clientes',
    href: '/owner/plans',
  },
];

export default function ActivatedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">¡Tu espacio está listo!</h1>
            <p className="text-muted-foreground">
              Tu organización ha sido activada exitosamente. Ya puedes comenzar a configurar
              tu espacio de trabajo.
            </p>
          </div>
        </div>

        {/* Next steps */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos pasos</CardTitle>
            <CardDescription>
              Completa estos pasos para tener tu espacio completamente configurado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.href}
                  href={step.href}
                  className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {step.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* CTA */}
        <Button asChild className="w-full" size="lg">
          <Link href="/owner">Ir a mi panel</Link>
        </Button>
      </div>
    </div>
  );
}
