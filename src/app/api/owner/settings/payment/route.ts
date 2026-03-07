import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';
import { encrypt, decrypt, maskCredential } from '@/lib/utils/encryption';

const PaymentSchema = z.object({
  accessToken: z.string().min(1, 'El Access Token es requerido'),
  publicKey: z.string().min(1, 'La Public Key es requerida'),
  webhookSecret: z.string().optional(),
});

/**
 * GET /api/owner/settings/payment
 *
 * Returns masked MP credential status. Full values are never exposed.
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const settings = await db.organizationSettings.findUnique({
      where: { organizationId },
      select: { mpAccessToken: true, mpPublicKey: true, mpWebhookSecret: true },
    });

    if (!settings?.mpAccessToken) {
      return NextResponse.json({ configured: false });
    }

    // Decrypt and immediately mask — full values never leave the server
    const plainAccessToken = decrypt(settings.mpAccessToken);
    const plainPublicKey = settings.mpPublicKey ? decrypt(settings.mpPublicKey) : null;

    return NextResponse.json({
      configured: true,
      accessToken: maskCredential(plainAccessToken),
      publicKey: maskCredential(plainPublicKey),
      webhookSecret: settings.mpWebhookSecret ? 'configurado' : null,
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json({ error: 'Error al cargar la configuración de pagos' }, { status: 500 });
  }
}

/**
 * PATCH /api/owner/settings/payment
 *
 * Encrypts and stores MP credentials. Upserts the settings row.
 */
export async function PATCH(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const body = await request.json();
    const result = PaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.issues },
        { status: 400 }
      );
    }

    const { accessToken, publicKey, webhookSecret } = result.data;

    await db.organizationSettings.upsert({
      where: { organizationId },
      update: {
        mpAccessToken: encrypt(accessToken),
        mpPublicKey: encrypt(publicKey),
        ...(webhookSecret !== undefined && { mpWebhookSecret: encrypt(webhookSecret) }),
      },
      create: {
        organizationId,
        mpAccessToken: encrypt(accessToken),
        mpPublicKey: encrypt(publicKey),
        mpWebhookSecret: webhookSecret ? encrypt(webhookSecret) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return NextResponse.json({ error: 'Error al guardar las credenciales' }, { status: 500 });
  }
}
