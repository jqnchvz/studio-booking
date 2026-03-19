import { cookies } from 'next/headers';
import { OwnerProfileForm } from '@/components/features/owner/OwnerProfileForm';
import { OwnerSettingsNav } from '@/components/features/owner/OwnerSettingsNav';
import { SubdomainSettings } from '@/components/features/owner/SubdomainSettings';

interface ProfileData {
  name: string;
  businessType: 'studio' | 'gym' | 'clinic' | 'other' | null;
  phone: string | null;
  address: string | null;
  timezone: string;
}

export default async function OwnerSettingsPage() {
  let data: ProfileData | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/owner/settings/profile`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (response.ok) {
      data = await response.json();
    }
  } catch (err) {
    console.error('Error loading profile settings:', err);
  }

  const defaultValues = {
    name: data?.name ?? '',
    businessType: data?.businessType ?? null,
    phone: data?.phone ?? null,
    address: data?.address ?? null,
    timezone: data?.timezone ?? 'America/Santiago',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra los datos de tu organización</p>
      </div>

      <OwnerSettingsNav />

      <OwnerProfileForm defaultValues={defaultValues} />

      <SubdomainSettings />
    </div>
  );
}
