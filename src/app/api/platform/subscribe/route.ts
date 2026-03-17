import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { getCurrentUser } from '@/lib/auth/get-user';
import { db } from '@/lib/db';
import { getMercadoPagoClient } from '@/lib/services/mercadopago.service';
import { mercadopagoConfig } from '@/lib/config/mercadopago.config';
import { PreApprovalCreateSchema } from '@/lib/types/mercadopago';
import { PreApproval } from 'mercadopago';

const platformSubscribeSchema = z.object({
  planId: z.string().min(1, 'El plan es requerido'),
  organizationId: z.string().min(1, 'La organización es requerida'),
});

/**
 * POST /api/platform/subscribe
 * Create MercadoPago preapproval for a business owner's platform subscription.
 * Uses platform-level MP credentials (not the org's own credentials).
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Autenticación requerida', message: 'Inicia sesión para continuar' },
        { status: 401 }
      );
    }

    // 2. Verify user is a business owner (role check)
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true, emailVerified: true, email: true, name: true },
    });

    if (!fullUser || fullUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acceso denegado', message: 'Solo los propietarios de negocio pueden suscribirse a un plan de plataforma' },
        { status: 403 }
      );
    }

    if (!fullUser.emailVerified) {
      return NextResponse.json(
        { error: 'Correo no verificado', message: 'Verifica tu correo electrónico antes de suscribirte' },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const { planId, organizationId } = platformSubscribeSchema.parse(body);

    // 4. Fetch and validate platform plan
    const plan = await db.platformPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado', message: 'El plan seleccionado no existe' },
        { status: 404 }
      );
    }
    if (!plan.isActive) {
      return NextResponse.json(
        { error: 'Plan no disponible', message: 'El plan seleccionado ya no está disponible' },
        { status: 400 }
      );
    }

    // 5. Verify the organization belongs to this owner
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, ownerId: true, status: true },
    });
    if (!org) {
      return NextResponse.json(
        { error: 'Organización no encontrada', message: 'La organización seleccionada no existe' },
        { status: 404 }
      );
    }
    if (org.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Acceso denegado', message: 'No tienes permiso para gestionar esta organización' },
        { status: 403 }
      );
    }
    if (org.status === 'active') {
      return NextResponse.json(
        { error: 'Organización ya activa', message: 'Tu organización ya tiene un plan activo' },
        { status: 409 }
      );
    }

    // 6. Free tier — activate immediately without MP checkout
    if (plan.price === 0) {
      await db.organization.update({
        where: { id: organizationId },
        data: { status: 'active' },
      });
      return NextResponse.json(
        { success: true, message: 'Plan gratuito activado', data: { initPoint: null } },
        { status: 200 }
      );
    }

    // 7. Create MercadoPago preapproval using platform credentials
    const client = getMercadoPagoClient();
    const preApprovalAPI = new PreApproval(client);

    const appUrl = mercadopagoConfig.appUrl;
    const backUrl = mercadopagoConfig.backUrl || `${appUrl}/onboarding/activated`;

    const requestBody = PreApprovalCreateSchema.parse({
      reason: `Plan ${plan.name} - Reservapp`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plan.price,
        currency_id: mercadopagoConfig.currencyId,
      },
      back_url: backUrl,
      // Format: "platform-{orgId}-{planId}" — parsed by the platform webhook
      external_reference: `platform-${organizationId}-${planId}`,
      payer_email: mercadopagoConfig.testPayerEmail || fullUser.email,
    });

    // notification_url is a valid MP API field but missing from SDK types — use spread + cast
    const preApproval = await preApprovalAPI.create({
      body: { ...requestBody, notification_url: `${appUrl}/api/webhooks/platform` } as typeof requestBody,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Preferencia de suscripción de plataforma creada',
        data: { initPoint: preApproval.init_point },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          message: 'Datos de entrada inválidos',
          details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error('Platform subscribe error:', error);
    return NextResponse.json(
      { error: 'Error al procesar', message: 'Ocurrió un error inesperado. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
