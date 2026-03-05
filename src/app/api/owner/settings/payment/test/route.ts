import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/middleware/owner';

const TestSchema = z.object({
  accessToken: z.string().min(1, 'El Access Token es requerido'),
});

/**
 * POST /api/owner/settings/payment/test
 *
 * Validates an MP access token by calling the MercadoPago /v1/users/me endpoint.
 * Does NOT save credentials — use PATCH /api/owner/settings/payment for that.
 */
export async function POST(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const body = await request.json();
    const result = TestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.issues },
        { status: 400 }
      );
    }

    const { accessToken } = result.data;

    const mpResponse = await fetch('https://api.mercadopago.com/v1/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpResponse.ok) {
      return NextResponse.json(
        { valid: false, error: 'Credenciales inválidas. Verifica el Access Token.' },
        { status: 422 }
      );
    }

    const mpUser = await mpResponse.json() as { email?: string };

    return NextResponse.json({
      valid: true,
      accountEmail: mpUser.email ?? null,
    });
  } catch (error) {
    console.error('Error testing MP connection:', error);
    return NextResponse.json(
      { valid: false, error: 'Error al conectar con MercadoPago' },
      { status: 500 }
    );
  }
}
