import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCLP, formatChileanDate, formatChileanDateTime } from '@/lib/utils/format';
import type { PaymentDetail } from '@/types/admin';

/**
 * Admin Payment Detail Page
 *
 * Server component that fetches detailed payment information and displays:
 * - Payment ID and MercadoPago ID (with link to MP dashboard)
 * - User information (with link to user detail)
 * - Amount breakdown (base + penalty = total)
 * - Due date vs paid date
 * - Status with badge
 * - Metadata JSON (if present)
 */
export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let payment: PaymentDetail | null = null;
  let error: string | null = null;

  try {
    // Forward cookies for authentication
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/payments/${id}`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (response.status === 404) {
      notFound();
    }

    if (!response.ok) {
      throw new Error('Failed to fetch payment');
    }

    const data = await response.json();
    payment = data.payment;
  } catch (err) {
    console.error('Error loading payment:', err);
    error = 'No se pudo cargar el pago. Por favor, recarga la página.';
  }

  // Three-state rendering: error
  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/admin/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a pagos
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!payment) return null;

  /**
   * Get badge variant based on payment status
   */
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved':
        return 'default'; // green
      case 'pending':
        return 'secondary'; // yellow
      case 'rejected':
        return 'destructive'; // red
      case 'refunded':
        return 'outline'; // gray
      default:
        return 'secondary';
    }
  };

  /**
   * Get status label in Spanish
   */
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  // Three-state rendering: success
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/admin/payments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">Detalle de Pago</h1>
          <p className="text-muted-foreground">ID: {payment.id}</p>
        </div>
        <Badge variant={getStatusBadgeVariant(payment.status)} className="text-lg px-4 py-2">
          {getStatusLabel(payment.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Pago</CardTitle>
            <CardDescription>Detalles de la transacción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">MercadoPago ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded">{payment.mercadopagoId}</code>
                <a
                  href={`https://www.mercadopago.cl/activities?id=${payment.mercadopagoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monto Base</p>
                <p className="text-lg font-medium">{formatCLP(payment.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Penalización</p>
                <p className={`text-lg font-medium ${payment.penaltyFee > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {payment.penaltyFee > 0 ? formatCLP(payment.penaltyFee) : '-'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-2xl font-bold">{formatCLP(payment.totalAmount)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                <p className="text-sm">{formatChileanDate(new Date(payment.dueDate))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Pago</p>
                <p className="text-sm">
                  {payment.paidAt ? formatChileanDateTime(new Date(payment.paidAt)) : '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Creado</p>
                <p className="text-sm">{formatChileanDateTime(new Date(payment.createdAt))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actualizado</p>
                <p className="text-sm">{formatChileanDateTime(new Date(payment.updatedAt))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User and Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle>Usuario y Suscripción</CardTitle>
            <CardDescription>Información del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Usuario</p>
              <Link href={`/admin/users/${payment.user.id}`} className="text-primary hover:underline">
                <p className="text-lg font-medium">{payment.user.name}</p>
              </Link>
              <p className="text-sm text-muted-foreground">{payment.user.email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-lg font-medium">{payment.subscription.plan.name}</p>
              <p className="text-sm text-muted-foreground">
                Precio: {formatCLP(payment.subscription.plan.price)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Estado de Suscripción</p>
              <Badge variant={payment.subscription.status === 'active' ? 'default' : 'secondary'}>
                {payment.subscription.status}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Suscripción ID</p>
              <code className="text-sm bg-muted px-2 py-1 rounded">{payment.subscription.id}</code>
            </div>
          </CardContent>
        </Card>

        {/* Metadata Card (if present) */}
        {payment.metadata && Object.keys(payment.metadata).length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Información adicional del pago</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(payment.metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
