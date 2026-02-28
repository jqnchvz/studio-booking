import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { DashboardNav } from '@/components/features/dashboard/DashboardNav';

/**
 * Dashboard Layout
 *
 * Server Component that authenticates the user then renders a sticky top
 * navigation bar (DashboardNav) above all /dashboard/* pages.
 *
 * Auth flow: unauthenticated → redirect to /login
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav userName={user.name} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
