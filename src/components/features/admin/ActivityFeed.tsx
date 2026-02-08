'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, Calendar, UserPlus, type LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCLP } from '@/lib/utils/format';
import type { ActivityEvent } from '@/types/admin';

interface ActivityFeedProps {
  /** Recent activity events (up to 20) */
  events: ActivityEvent[];
}

/**
 * Icon mapping for each event type
 */
const EVENT_ICONS: Record<ActivityEvent['type'], LucideIcon> = {
  subscription: CreditCard,
  payment: DollarSign,
  reservation: Calendar,
  user: UserPlus,
};

/**
 * Color classes for each event type
 * Format: "text-{color}-600 bg-{color}-50"
 */
const EVENT_COLORS: Record<ActivityEvent['type'], string> = {
  subscription: 'text-blue-600 bg-blue-50',
  payment: 'text-green-600 bg-green-50',
  reservation: 'text-purple-600 bg-purple-50',
  user: 'text-orange-600 bg-orange-50',
};

/**
 * ActivityFeed Component
 *
 * Displays recent system events in a timeline format.
 * Shows events from subscriptions, payments, reservations, and user registrations.
 *
 * Features:
 * - Color-coded icons by event type
 * - Relative time formatting in Spanish ("hace 2 horas")
 * - User names and event details
 * - Optional amount badges for payment events
 * - Empty state when no events available
 * - Sorted by timestamp (newest first)
 *
 * Event Types:
 * - Subscription (blue): New subscriptions to plans
 * - Payment (green): Approved payment transactions
 * - Reservation (purple): New booking reservations
 * - User (orange): New user registrations
 */
export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimos 20 eventos del sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay actividad reciente
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const Icon = EVENT_ICONS[event.type];
              const colors = EVENT_COLORS[event.type];

              return (
                <div key={event.id} className="flex gap-4 items-start">
                  {/* Event type icon with color coding */}
                  <div className={`rounded-full p-2 ${colors}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Event details */}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {event.action}
                    </p>

                    {event.metadata.userName && (
                      <p className="text-sm text-muted-foreground">
                        Usuario: {event.metadata.userName}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.timestamp), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>

                  {/* Amount badge for payment events */}
                  {event.metadata.amount !== undefined && (
                    <Badge variant="secondary">
                      {formatCLP(event.metadata.amount)}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
