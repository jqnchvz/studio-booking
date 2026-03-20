import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata = { title: 'Reservar' };

export default async function BusinessBookPage({ params }: BookPageProps) {
  const { slug } = await params;

  const org = await db.organization.findUnique({
    where: { slug, status: 'active' },
    select: {
      id: true,
      name: true,
      resources: {
        where: { isActive: true, dropInEnabled: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      },
    },
  });

  if (!org) notFound();

  const hasDropInResources = org.resources.length > 0;
  const base = `/b/${slug}`;

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Reservar en {org.name}</h1>
          <p className="text-muted-foreground">
            {hasDropInResources
              ? 'Para hacer una reserva necesitas iniciar sesión con tu cuenta de Reservapp.'
              : 'Este negocio no tiene recursos habilitados para reservas directas. Revisa los planes de suscripción disponibles.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {hasDropInResources ? (
            <>
              <Button size="lg" asChild>
                <Link href="/login">
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Crear cuenta</Link>
              </Button>
            </>
          ) : (
            <Button size="lg" asChild>
              <Link href={`${base}/plans`}>
                Ver planes
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
