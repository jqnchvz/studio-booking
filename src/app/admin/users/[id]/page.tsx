import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserProfile } from '@/components/features/admin/UserProfile';
import { UserSubscriptionCard } from '@/components/features/admin/UserSubscriptionCard';
import { UserPaymentHistory } from '@/components/features/admin/UserPaymentHistory';
import { UserReservationHistory } from '@/components/features/admin/UserReservationHistory';
import { PromoteUserButton } from '@/components/features/admin/PromoteUserButton';
import type { UserDetail } from '@/types/admin';

/**
 * Admin User Detail Page
 *
 * Server component that fetches detailed user information and displays:
 * - User profile (email, verified status, admin role, registration date)
 * - Subscription details with activate/suspend actions
 * - Payment history (last 50 payments)
 * - Reservation history (last 50 reservations)
 * - Promote/demote admin button
 */
export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user: UserDetail | null = null;
  let error: string | null = null;

  try {
    // Forward cookies for authentication
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users/${id}`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (response.status === 404) {
      notFound();
    }

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const data = await response.json();
    user = data.user;
  } catch (err) {
    console.error('Error loading user:', err);
    error = 'No se pudo cargar el usuario. Por favor, recarga la página.';
  }

  // Three-state rendering: error
  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a usuarios
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) return null;

  // Three-state rendering: success
  return (
    <div className="space-y-6">
      {/* Header with back button and promote button */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <PromoteUserButton userId={user.id} currentIsAdmin={user.isAdmin} />
      </div>

      {/* User profile card */}
      <UserProfile user={user} />

      {/* Subscription card with activate/suspend actions */}
      <UserSubscriptionCard userId={user.id} subscription={user.subscription} />

      {/* Payment history table */}
      <UserPaymentHistory payments={user.payments} />

      {/* Reservation history table */}
      <UserReservationHistory reservations={user.reservations} />
    </div>
  );
}
