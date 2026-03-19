import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

interface TenantPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TenantPageProps) {
  const { slug } = await params;
  const org = await db.organization.findUnique({
    where: { slug, status: 'active' },
    select: { name: true },
  });

  if (!org) return { title: 'Negocio no encontrado' };

  return {
    title: `${org.name} — Reservapp`,
    description: `Reserva en ${org.name} a través de Reservapp.`,
  };
}

export default async function TenantLandingPage({ params }: TenantPageProps) {
  const { slug } = await params;
  const org = await db.organization.findUnique({
    where: { slug, status: 'active' },
    select: { id: true, name: true, slug: true },
  });

  if (!org) notFound();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-lg">
        <h1 className="text-3xl font-bold">{org.name}</h1>
        <p className="text-muted-foreground">
          Bienvenido a {org.name}. Próximamente podrás ver recursos, planes y
          realizar reservas desde aquí.
        </p>
        <p className="text-xs text-muted-foreground">
          Powered by Reservapp
        </p>
      </div>
    </div>
  );
}
