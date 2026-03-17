import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { GuestBookingForm } from '@/components/booking/GuestBookingForm';

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function PublicBookingPage({ params }: Props) {
  const { orgSlug } = await params;

  const org = await db.organization.findUnique({
    where: { slug: orgSlug, status: 'active' },
    select: {
      id: true,
      name: true,
      slug: true,
      resources: {
        where: { isActive: true, dropInEnabled: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          capacity: true,
          dropInPricePerHour: true,
          availability: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' },
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      },
    },
  });

  if (!org) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">{org.name}</h1>
          <p className="mt-2 text-muted-foreground">
            Reserva un espacio sin necesidad de registrarte
          </p>
        </div>

        {org.resources.length === 0 ? (
          <div className="bg-muted/50 border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              No hay recursos disponibles para reserva directa en este momento.
            </p>
          </div>
        ) : (
          <GuestBookingForm
            orgSlug={org.slug}
            resources={org.resources}
          />
        )}
      </div>
    </div>
  );
}
