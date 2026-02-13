import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, CreditCard, Settings } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';

/**
 * Admin Layout
 *
 * Provides consistent navigation and access control for all admin pages.
 *
 * Structure:
 * - Top bar with app branding and back link
 * - Sidebar with navigation links
 * - Main content area
 *
 * Access Control:
 * - Requires authenticated user with isAdmin flag
 * - Redirects non-admin users to /dashboard
 * - This is the third layer of protection (middleware + API + layout)
 *
 * Navigation Links:
 * - Dashboard: Overview metrics and charts
 * - Usuarios: User management (future)
 * - Reservas: Reservation management (future)
 * - Suscripciones: Subscription management (future)
 * - Configuración: System settings (future)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Access control: Verify user is admin
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Reservapp Admin</h1>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-73px)] p-4">
          <nav className="space-y-1">
            <NavLink href="/admin" icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            <NavLink href="/admin/users" icon={Users}>
              Usuarios
            </NavLink>
            <NavLink href="/admin/reservations" icon={Calendar}>
              Reservas
            </NavLink>
            <NavLink href="/admin/subscriptions" icon={CreditCard}>
              Suscripciones
            </NavLink>
            <NavLink href="/admin/settings" icon={Settings}>
              Configuración
            </NavLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

/**
 * Navigation Link Component
 *
 * Renders a navigation link with icon and active state highlighting.
 * Uses Next.js usePathname to determine active state.
 */
function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  // Note: We can't use usePathname in a server component
  // For now, all links use the same style. In a future enhancement,
  // we could make this a client component or use URL matching.

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground transition"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
