import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { db } from '@/lib/db';
import { OwnerNavLink } from '@/components/features/owner/OwnerNavLink';
import { AdminLogoutButton } from '@/components/features/admin/AdminLogoutButton';

/**
 * Owner Portal Layout
 *
 * Full-height sidebar layout for business owners. Uses the same sidebar
 * CSS tokens as the admin layout. Three-layer access control:
 * middleware → layout → API guard.
 *
 * Access: authenticated users with isOwner === true only.
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || !user.isOwner) {
    redirect('/dashboard');
  }

  // Resolve the owner's organization name for the sidebar brand mark
  const org = await db.organization.findFirst({
    where: { ownerId: user.id },
    select: { name: true },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 bg-sidebar flex-shrink-0 flex flex-col border-r border-sidebar-border">
        {/* Brand mark */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">
              {org?.name?.[0]?.toUpperCase() ?? 'O'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground font-semibold text-sm leading-none truncate">
              {org?.name ?? 'Mi Empresa'}
            </p>
            <p className="text-sidebar-muted text-xs mt-0.5">Panel de gestión</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <OwnerNavLink href="/owner" icon="dashboard">
            Dashboard
          </OwnerNavLink>
          <OwnerNavLink href="/owner/reservations" icon="reservations">
            Reservaciones
          </OwnerNavLink>
          <OwnerNavLink href="/owner/clients" icon="clients">
            Clientes
          </OwnerNavLink>
          <OwnerNavLink href="/owner/resources" icon="resources">
            Recursos
          </OwnerNavLink>
          <OwnerNavLink href="/owner/plans" icon="plans">
            Planes
          </OwnerNavLink>
          <OwnerNavLink href="/owner/subscriptions" icon="subscriptions">
            Suscripciones
          </OwnerNavLink>
          <OwnerNavLink href="/owner/payments" icon="payments">
            Pagos
          </OwnerNavLink>
          <OwnerNavLink href="/owner/settings" icon="settings">
            Configuración
          </OwnerNavLink>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border">
          <AdminLogoutButton />
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky top bar */}
        <header className="h-14 flex items-center px-6 border-b bg-card flex-shrink-0">
          <p className="text-sm text-muted-foreground font-medium">
            {org?.name ?? 'Panel de gestión'}
          </p>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
