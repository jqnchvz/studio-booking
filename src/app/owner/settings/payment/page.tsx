import { cookies } from 'next/headers';
import { OwnerSettingsNav } from '@/components/features/owner/OwnerSettingsNav';
import { PaymentSettingsForm } from '@/components/features/owner/PaymentSettingsForm';

interface PaymentStatus {
  configured: boolean;
  accessToken?: string;
  publicKey?: string;
  webhookSecret?: string | null;
}

export default async function OwnerPaymentSettingsPage() {
  let data: PaymentStatus = { configured: false };

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/owner/settings/payment`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (response.ok) {
      data = await response.json();
    }
  } catch (err) {
    console.error('Error loading payment settings:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra los datos de tu organización</p>
      </div>

      <OwnerSettingsNav />

      <div>
        <h2 className="text-base font-semibold mb-1">MercadoPago</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Conecta tu cuenta de MercadoPago para procesar pagos de tus clientes.
        </p>

        <PaymentSettingsForm
          configured={data.configured}
          maskedAccessToken={data.accessToken}
          maskedPublicKey={data.publicKey}
          webhookConfigured={!!data.webhookSecret}
        />
      </div>
    </div>
  );
}
