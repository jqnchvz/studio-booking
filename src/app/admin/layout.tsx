import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { AdminNavLink } from '@/components/features/admin/AdminNavLink';
import { AdminLogoutButton } from '@/components/features/admin/AdminLogoutButton';
import { MobileSidebar } from '@/components/ui/mobile-sidebar';

/**
 * Admin Layout
 *
 * Responsive sidebar layout with dark navigation panel and warm-themed
 * content area. Desktop shows a fixed 264px sidebar; mobile collapses
 * it into a hamburger-triggered Sheet drawer.
 *
 * Three-layer access control: middleware → layout → API guard.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Shared sidebar content used in both desktop aside and mobile Sheet
  const sidebarContent = (
    <>
      {/* Brand mark */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-sm">R</span>
        </div>
        <div className="min-w-0">
          <p className="text-sidebar-foreground font-semibold text-sm leading-none">
            Reservapp
          </p>
          <p className="text-sidebar-muted text-xs mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <AdminNavLink href="/admin" icon="dashboard">
          Dashboard
        </AdminNavLink>
        <AdminNavLink href="/admin/tenants" icon="tenants">
          Empresas
        </AdminNavLink>
        <AdminNavLink href="/admin/settings" icon="settings">
          Configuración
        </AdminNavLink>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <AdminLogoutButton />
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop sidebar (hidden on mobile) ──────────────── */}
      <aside className="hidden md:flex w-64 bg-sidebar flex-shrink-0 flex-col border-r border-sidebar-border">
        {sidebarContent}
      </aside>

      {/* ── Main content area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky top bar */}
        <header className="h-14 flex items-center gap-3 px-4 md:px-6 border-b bg-card flex-shrink-0">
          {/* Mobile hamburger menu */}
          <MobileSidebar>{sidebarContent}</MobileSidebar>

          <p className="text-sm text-muted-foreground font-medium">
            Panel de Administración
          </p>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
