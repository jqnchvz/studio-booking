import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  Users,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Settings,
  LayoutGrid,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface DashboardData {
  metrics: {
    activeSubscriptions: number;
    upcomingReservations: number;
    totalClients: number;
    mpConfigured: boolean;
  };
  onboarding: {
    complete: boolean;
    steps: {
      mpConfigured: boolean;
      hasResources: boolean;
      hasPlans: boolean;
    };
  };
}

const ONBOARDING_STEPS = [
  {
    key: 'mpConfigured' as const,
    label: 'Configura MercadoPago',
    description: 'Conecta tu cuenta para recibir pagos',
    href: '/owner/settings/payment',
    icon: Settings,
  },
  {
    key: 'hasResources' as const,
    label: 'Agrega tu primer recurso',
    description: 'Crea las salas o espacios que ofrecerás',
    href: '/owner/resources',
    icon: LayoutGrid,
  },
  {
    key: 'hasPlans' as const,
    label: 'Define tus planes',
    description: 'Establece los planes de suscripción para tus clientes',
    href: '/owner/plans',
    icon: CreditCard,
  },
];

export default async function OwnerDashboardPage() {
  let data: DashboardData | null = null;
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/owner/dashboard`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch dashboard');
    data = await response.json();
  } catch (err) {
    console.error('Error loading owner dashboard:', err);
    error = 'No se pudo cargar el dashboard. Por favor, recarga la página.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de tu organización
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Onboarding checklist ──────────────────────────── */}
      {data && !data.onboarding.complete && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span>Configura tu espacio</span>
              <Badge variant="secondary" className="text-xs font-normal">
                {Object.values(data.onboarding.steps).filter(Boolean).length}/3 completados
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ONBOARDING_STEPS.map((step) => {
              const done = data!.onboarding.steps[step.key];
              const Icon = step.icon;
              return (
                <Link
                  key={step.key}
                  href={done ? '#' : step.href}
                  className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                    done
                      ? 'opacity-60 cursor-default'
                      : 'hover:bg-primary/10 cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? 'bg-success/15' : 'bg-muted'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>
                      {step.label}
                    </p>
                    {!done && (
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    )}
                  </div>
                  {!done && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Metrics ───────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suscripciones activas</p>
                  <p className="text-2xl font-bold">{data.metrics.activeSubscriptions}</p>
                </div>
                <CreditCard className="h-5 w-5 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservas próximas (7d)</p>
                  <p className="text-2xl font-bold">{data.metrics.upcomingReservations}</p>
                </div>
                <Calendar className="h-5 w-5 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total clientes</p>
                  <p className="text-2xl font-bold">{data.metrics.totalClients}</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {data.metrics.mpConfigured ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">MercadoPago</p>
                      <p className="text-sm font-medium text-success">Configurado</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">MercadoPago</p>
                      <Link
                        href="/owner/settings/payment"
                        className="text-sm font-medium text-warning hover:underline"
                      >
                        Configurar →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Quick links ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Ver reservaciones', href: '/owner/reservations', icon: Calendar },
          { label: 'Gestionar recursos', href: '/owner/resources', icon: LayoutGrid },
          { label: 'Ver clientes', href: '/owner/clients', icon: Users },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
