import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/db';
import { queueEmail } from '@/lib/queue/email-queue';

/**
 * POST /api/webhooks/dropin/[orgSlug]
 *
 * Receives MercadoPago webhook events for drop-in payments.
 * On approved payment: confirms reservation + sends email to guest.
 * On rejected/cancelled: cancels the pending reservation.
 *
 * Always returns 200 to prevent MercadoPago retries.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;
    const body = await request.json();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📨 Drop-in Webhook [${orgSlug}]`);
    console.log(`   Type: ${body.type}, Action: ${body.action}`);
    console.log(`   Data ID: ${body.data?.id}`);

    // Only handle payment events
    if (body.type !== 'payment') {
      console.log('   Skipping non-payment event');
      return NextResponse.json({ success: true });
    }

    // ── Deduplicate ───────────────────────────────────────────────────
    const eventId = String(body.id);
    const existing = await db.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existing) {
      console.log('   Duplicate event — skipping');
      return NextResponse.json({ success: true });
    }

    await db.webhookEvent.create({
      data: {
        eventId,
        eventType: `dropin.${body.action}`,
        data: body,
        processed: false,
      },
    });

    // ── Fetch org credentials ─────────────────────────────────────────
    const org = await db.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        name: true,
        settings: {
          select: {
            mpAccessToken: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!org?.settings?.mpAccessToken) {
      console.error('   Org not found or no MP credentials');
      await db.webhookEvent.update({
        where: { eventId },
        data: { processed: true },
      });
      return NextResponse.json({ success: true });
    }

    // ── Fetch payment from MercadoPago ────────────────────────────────
    const mpClient = new MercadoPagoConfig({
      accessToken: org.settings.mpAccessToken,
      options: { timeout: 5000 },
    });

    const paymentAPI = new Payment(mpClient);
    const payment = await paymentAPI.get({ id: body.data.id });

    console.log(`   Payment status: ${payment.status}`);
    console.log(`   External ref: ${payment.external_reference}`);

    const reservationId = payment.external_reference;
    if (!reservationId) {
      console.error('   No external_reference on payment');
      await db.webhookEvent.update({
        where: { eventId },
        data: { processed: true },
      });
      return NextResponse.json({ success: true });
    }

    // ── Find reservation ──────────────────────────────────────────────
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: { resource: { select: { name: true, type: true } } },
    });

    if (!reservation || reservation.type !== 'dropin') {
      console.error(`   Reservation ${reservationId} not found or not dropin`);
      await db.webhookEvent.update({
        where: { eventId },
        data: { processed: true },
      });
      return NextResponse.json({ success: true });
    }

    // ── Handle payment status ─────────────────────────────────────────
    if (payment.status === 'approved') {
      await db.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'confirmed',
          dropInPaymentId: String(payment.id),
        },
      });

      console.log(`   ✅ Reservation ${reservationId} confirmed`);

      // Fire-and-forget confirmation email
      if (reservation.guestEmail) {
        const startChile = reservation.startTime.toLocaleString('es-CL', {
          timeZone: 'America/Santiago',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const endTime = reservation.endTime.toLocaleTimeString('es-CL', {
          timeZone: 'America/Santiago',
          hour: '2-digit',
          minute: '2-digit',
        });
        const amount = payment.transaction_amount ?? 0;

        queueEmail({
          type: 'dropin_confirmation',
          to: reservation.guestEmail,
          subject: `Reserva confirmada — ${reservation.resource.name}`,
          templateName: 'dropin-confirmation',
          templateData: {
            guestName: reservation.guestName ?? 'Invitado',
            resourceName: reservation.resource.name,
            dateTime: `${startChile} — ${endTime}`,
            amountPaid: `$${amount.toLocaleString('es-CL')}`,
            orgName: org.name,
            orgPhone: org.settings.phone ?? '',
            orgAddress: org.settings.address ?? '',
          },
        }).catch((err) =>
          console.error('Email queue error:', err)
        );
      }
    } else if (
      payment.status === 'rejected' ||
      payment.status === 'cancelled'
    ) {
      await db.reservation.update({
        where: { id: reservationId },
        data: { status: 'cancelled' },
      });

      console.log(`   ❌ Reservation ${reservationId} cancelled (payment ${payment.status})`);
    }

    // Mark event as processed
    await db.webhookEvent.update({
      where: { eventId },
      data: { processed: true },
    });

    console.log(`${'='.repeat(60)}\n`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Drop-in webhook error:', error);
    // Always 200 to prevent retries
    return NextResponse.json({ success: false });
  }
}
