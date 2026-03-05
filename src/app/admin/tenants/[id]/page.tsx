import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  CreditCard,
  LayoutGrid,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TenantDetailActions } from '@/components/features/admin/TenantDetailActions';

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  };
  settings: {
    businessType: string | null;
    phone: string | null;
    address: string | null;
    timezone: string | null;
    mpAccessToken: string | null;
    mpPublicKey: string | null;
    mpWebhookSecret: string | null;
  } | null;
  stats: {
    memberCount: number;
    resourceCount: number;
    planCount: number;
    activeSubscriptions: number;
    totalReservations: number;
  };
  recentActivity: {
    id: string;
    type: 'reservation';
    status: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    resourceName: string;
    userName: string;
    userEmail: string;
  }[];
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-success/15 text-success border-0">Activa</Badge>;
    case 'suspended':
      return <Badge className="bg-warning/15 text-warning border-0">Suspendida</Badge>;
    case 'pending':
      return <Badge variant="secondary">Pendiente</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function ReservationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'confirmed':
      return <Badge className="bg-success/15 text-success border-0 text-xs">Confirmada</Badge>;
    case 'pending':
      return <Badge variant="secondary" className="text-xs">Pendiente</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-xs text-muted-foreground">Cancelada</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
  });
}

function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  });
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let tenant: TenantDetail | null = null;
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/organizations/${id}`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (response.status === 404) notFound();
    if (!response.ok) throw new Error('Failed to fetch organization');

    const data = await response.json();
    tenant = data.organization;
  } catch (err) {
    console.error('Error loading tenant:', err);
    error = 'No se pudo cargar la información de la empresa.';
  }

  if (!tenant) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Empresas
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error ?? 'Error desconocido'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const mpConfigured = !!(tenant.settings?.mpAccessToken);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/tenants"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Empresas
      </Link>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <StatusBadge status={tenant.status} />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs font-mono">
                {tenant.slug}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Creada el {formatDate(tenant.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <TenantDetailActions
          tenantId={tenant.id}
          tenantName={tenant.name}
          status={tenant.status}
        />
      </div>

      {/* ── Stats row ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuarios</p>
                <p className="text-2xl font-bold">{tenant.stats.memberCount}</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suscripciones activas</p>
                <p className="text-2xl font-bold">{tenant.stats.activeSubscriptions}</p>
              </div>
              <CreditCard className="h-5 w-5 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservas totales</p>
                <p className="text-2xl font-bold">{tenant.stats.totalReservations}</p>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recursos</p>
                <p className="text-2xl font-bold">{tenant.stats.resourceCount}</p>
              </div>
              <LayoutGrid className="h-5 w-5 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Owner info ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Propietario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{tenant.owner.name}</p>
              <p className="text-sm text-muted-foreground">{tenant.owner.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {tenant.owner.emailVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">Email verificado</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-warning" />
                  <span className="text-sm text-warning">Email no verificado</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── MercadoPago status ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MercadoPago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {mpConfigured ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">Credenciales configuradas</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sin configurar</span>
                </>
              )}
            </div>
            {mpConfigured && tenant.settings && (
              <div className="space-y-1.5 text-sm">
                {tenant.settings.mpAccessToken && (
                  <div>
                    <span className="text-muted-foreground text-xs">Access Token</span>
                    <p className="font-mono text-xs">{tenant.settings.mpAccessToken}</p>
                  </div>
                )}
                {tenant.settings.mpPublicKey && (
                  <div>
                    <span className="text-muted-foreground text-xs">Public Key</span>
                    <p className="font-mono text-xs">{tenant.settings.mpPublicKey}</p>
                  </div>
                )}
                {tenant.settings.mpWebhookSecret && (
                  <div>
                    <span className="text-muted-foreground text-xs">Webhook Secret</span>
                    <p className="font-mono text-xs">{tenant.settings.mpWebhookSecret}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent activity ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {tenant.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin actividad registrada
            </p>
          ) : (
            <div className="divide-y divide-border">
              {tenant.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.resourceName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.userName} · {formatDateTime(item.startTime)}
                    </p>
                  </div>
                  <ReservationStatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
