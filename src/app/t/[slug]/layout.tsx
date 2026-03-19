import { notFound } from 'next/navigation';
import { getTenantOrg } from '@/lib/utils/tenant';
import { TenantNavbar } from '@/components/tenant/TenantNavbar';
import { TenantFooter } from '@/components/tenant/TenantFooter';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getTenantOrg(slug);
  if (!org) return { title: 'Negocio no encontrado' };

  return {
    title: {
      default: `${org.name} — Reservapp`,
      template: `%s — ${org.name}`,
    },
    description: `Reserva en ${org.name} a través de Reservapp.`,
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  const org = await getTenantOrg(slug);

  if (!org) notFound();

  return (
    <>
      <TenantNavbar orgName={org.name} />
      <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      <TenantFooter orgName={org.name} />
    </>
  );
}
