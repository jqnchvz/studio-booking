import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPaymentHistory } from '@/components/features/admin/UserPaymentHistory';
import { SubscriptionStatusActions } from '@/components/features/admin/SubscriptionStatusActions';
import { formatCLP, formatChileanDate } from '@/lib/utils/format';
import type { SubscriptionDetail } from '@/types/admin';

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'suspended':
    case 'past_due':
      return 'destructive';
    case 'cancelled':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Activo';
    case 'pending':
      return 'Pendiente';
    case 'suspended':
      return 'Suspendido';
    case 'cancelled':
      return 'Cancelado';
    case 'past_due':
      return 'Vencido';
    default:
      return status;
  }
}

/**
 * Admin Subscription Detail Page
 *
 * Server component displaying full subscription info:
 * - User info with link to user detail page
 * - Plan details, pricing, billing dates
 * - Admin status actions (activate/suspend/cancel)
 * - Last 20 payments via UserPaymentHistory
 */
export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let subscription: SubscriptionDetail | null = null;
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/subscriptions/${id}`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (response.status === 404) notFound();

    if (!response.ok) throw new Error('Failed to fetch subscription');

    const data = await response.json();
    subscription = data.subscription;
  } catch (err) {
    console.error('Error loading subscription:', err);
    error = 'No se pudo cargar la suscripción. Por favor, recarga la página.';
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/admin/subscriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a suscripciones
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!subscription) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href="/admin/subscriptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">{subscription.planName}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(subscription.status)}>
              {getStatusLabel(subscription.status)}
            </Badge>
            <span className="text-muted-foreground text-sm">
              {formatCLP(subscription.planPrice)} / mes
            </span>
          </div>
        </div>

        {/* Admin status actions */}
        <SubscriptionStatusActions
          subscriptionId={subscription.id}
          currentStatus={subscription.status}
        />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User info */}
        <Card>
          <CardHeader>
            <CardTitle>Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <Link
                href={`/admin/users/${subscription.user.id}`}
                className="font-medium hover:underline"
              >
                {subscription.user.name}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{subscription.user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Billing info */}
        <Card>
          <CardHeader>
            <CardTitle>Facturación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Período actual</p>
                <p className="font-medium text-sm">
                  {formatChileanDate(
                    new Date(subscription.currentPeriodStart)
                  )}{' '}
                  –{' '}
                  {formatChileanDate(new Date(subscription.currentPeriodEnd))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Próxima facturación
                </p>
                <p className="font-medium">
                  {formatChileanDate(new Date(subscription.nextBillingDate))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Creado</p>
                <p className="font-medium">
                  {formatChileanDate(new Date(subscription.createdAt))}
                </p>
              </div>
              {subscription.cancelledAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Cancelado</p>
                  <p className="font-medium">
                    {formatChileanDate(new Date(subscription.cancelledAt))}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment history */}
      <UserPaymentHistory payments={subscription.payments} />
    </div>
  );
}
