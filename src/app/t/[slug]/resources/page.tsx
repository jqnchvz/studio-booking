import { notFound } from 'next/navigation';
import { Clock, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { getDayName } from '@/lib/utils/tenant';

interface ResourcesPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata = { title: 'Recursos' };

export default async function TenantResourcesPage({ params }: ResourcesPageProps) {
  const { slug } = await params;

  const org = await db.organization.findUnique({
    where: { slug, status: 'active' },
    select: {
      id: true,
      name: true,
      resources: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          capacity: true,
          availability: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' },
            select: { dayOfWeek: true, startTime: true, endTime: true },
          },
        },
      },
    },
  });

  if (!org) notFound();

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Recursos</h1>
          <p className="text-muted-foreground">
            Espacios y equipos disponibles en {org.name}.
          </p>
        </div>

        {org.resources.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No hay recursos disponibles en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {org.resources.map((resource) => (
              <div
                key={resource.id}
                className="rounded-xl border border-border bg-card p-6 space-y-4"
              >
                <div>
                  <h2 className="font-semibold text-lg">{resource.name}</h2>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {resource.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {resource.capacity && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {resource.capacity} {resource.capacity === 1 ? 'persona' : 'personas'}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 capitalize">
                    {resource.type}
                  </span>
                </div>

                {resource.availability.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Horarios
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {resource.availability.map((slot, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                        >
                          <Clock className="h-3 w-3" />
                          {getDayName(slot.dayOfWeek)} {slot.startTime}–{slot.endTime}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
