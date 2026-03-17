import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '@/lib/db';

/**
 * POST /api/book/[orgSlug]/checkout
 *
 * Public endpoint (no auth). Creates a pending drop-in reservation and
 * a MercadoPago one-time payment preference, returning the init_point URL.
 *
 * Body: { resourceId, startTime, endTime, guestName, guestEmail, guestPhone?, notes? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const body = await request.json();
    const { resourceId, startTime, endTime, guestName, guestEmail, guestPhone, notes } = body;

    // ── Validate input ────────────────────────────────────────────────
    if (!resourceId || !startTime || !endTime || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (resourceId, startTime, endTime, guestName, guestEmail)' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ error: 'Horario inválido' }, { status: 400 });
    }

    // ── Fetch org + settings + resource ───────────────────────────────
    const org = await db.organization.findUnique({
      where: { slug: orgSlug, status: 'active' },
      select: {
        id: true,
        name: true,
        settings: {
          select: { mpAccessToken: true },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    if (!org.settings?.mpAccessToken) {
      return NextResponse.json(
        { error: 'Esta organización no tiene pagos configurados' },
        { status: 422 }
      );
    }

    const resource = await db.resource.findFirst({
      where: {
        id: resourceId,
        organizationId: org.id,
        isActive: true,
        dropInEnabled: true,
      },
      select: {
        id: true,
        name: true,
        dropInPricePerHour: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Recurso no encontrado o no disponible para reserva directa' },
        { status: 404 }
      );
    }

    if (!resource.dropInPricePerHour || resource.dropInPricePerHour <= 0) {
      return NextResponse.json(
        { error: 'Este recurso no tiene precio configurado' },
        { status: 422 }
      );
    }

    // ── Calculate price ───────────────────────────────────────────────
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalAmount = Math.round(resource.dropInPricePerHour * durationHours);

    // ── Check for conflicts ───────────────────────────────────────────
    const conflict = await db.reservation.findFirst({
      where: {
        resourceId,
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { startTime: { lte: start }, endTime: { gt: start } },
          { startTime: { lt: end }, endTime: { gte: end } },
          { startTime: { gte: start }, endTime: { lte: end } },
        ],
      },
      select: { id: true },
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'Este horario ya no está disponible. Por favor, elige otro.' },
        { status: 409 }
      );
    }

    // ── Create pending reservation ────────────────────────────────────
    const reservation = await db.reservation.create({
      data: {
        resourceId,
        title: `Drop-in: ${resource.name}`,
        startTime: start,
        endTime: end,
        status: 'pending',
        type: 'dropin',
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone?.trim() || null,
        description: notes?.trim() || null,
        attendees: 1,
      },
    });

    // ── Create MercadoPago preference with org credentials ────────────
    const mpClient = new MercadoPagoConfig({
      accessToken: org.settings.mpAccessToken,
      options: { timeout: 5000 },
    });

    const preferenceAPI = new Preference(mpClient);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const preference = await preferenceAPI.create({
      body: {
        items: [
          {
            id: reservation.id,
            title: `Reserva ${resource.name}`,
            description: `${durationHours}h · ${guestName}`,
            quantity: 1,
            unit_price: totalAmount,
            currency_id: 'CLP',
          },
        ],
        payer: {
          name: guestName,
          email: guestEmail,
        },
        back_urls: {
          success: `${appUrl}/book/${orgSlug}/success?reservationId=${reservation.id}`,
          failure: `${appUrl}/book/${orgSlug}/failure`,
          pending: `${appUrl}/book/${orgSlug}/pending`,
        },
        ...(appUrl.startsWith('https') ? { auto_return: 'approved' as const } : {}),
        notification_url: `${appUrl}/api/webhooks/dropin/${orgSlug}`,
        external_reference: reservation.id,
      },
    });

    if (!preference.init_point) {
      // Clean up the reservation if preference creation failed
      await db.reservation.delete({ where: { id: reservation.id } });
      return NextResponse.json(
        { error: 'Error al crear la preferencia de pago' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      initPoint: preference.init_point,
      reservationId: reservation.id,
    });
  } catch (error) {
    console.error('Error in drop-in checkout:', error);
    return NextResponse.json(
      { error: 'Error al procesar la reserva' },
      { status: 500 }
    );
  }
}
