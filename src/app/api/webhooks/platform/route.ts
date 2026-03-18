import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPreApprovalStatus } from '@/lib/services/mercadopago.service';
import {
  validateWebhookSignature,
  shouldSkipValidation,
} from '@/lib/services/mercadopago-webhook-validation';
import { type MercadoPagoWebhookEvent } from '@/lib/services/webhook-handlers.service';

/**
 * POST /api/webhooks/platform
 * Handles platform-level MercadoPago subscription events for business owners.
 *
 * Separate from /api/webhooks/mercadopago (which handles per-org tenant payments).
 * Registered as the notification_url when creating platform preapprovals.
 *
 * Events handled:
 * - preapproval authorized → Organization.status = "active"
 * - preapproval cancelled  → Organization.status = "suspended"
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🏢 Platform Webhook Received');
    console.log('='.repeat(60));

    const body: MercadoPagoWebhookEvent = await request.json();
    const signature = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');

    console.log(`   Event ID: ${body.id}`);
    console.log(`   Type: ${body.type}`);
    console.log(`   Action: ${body.action}`);
    console.log(`   Resource ID: ${body.data.id}`);

    // Validate signature
    if (!shouldSkipValidation()) {
      const isValid = validateWebhookSignature(
        signature,
        requestId,
        body.data.id,
        body.type
      );
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        console.log('='.repeat(60) + '\n');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ Signature validated');
    } else {
      console.log('⚠️  Signature validation skipped (development mode)');
    }

    // Only handle preapproval events (platform subscriptions use preapprovals)
    if (body.type !== 'subscription_preapproval' && body.type !== 'preapproval') {
      console.log(`⚠️  Skipping non-preapproval event type: ${body.type}`);
      console.log('='.repeat(60) + '\n');
      return NextResponse.json({ success: true, message: 'Event skipped' });
    }

    // Fetch preapproval details from MercadoPago
    const preapproval = await getPreApprovalStatus(body.data.id);

    console.log(`   Preapproval status: ${preapproval.status}`);
    console.log(`   External reference: ${preapproval.external_reference}`);

    // Only handle platform events (external_reference starts with "platform-")
    if (!preapproval.external_reference?.startsWith('platform-')) {
      console.log(`⚠️  Not a platform event, skipping`);
      console.log('='.repeat(60) + '\n');
      return NextResponse.json({ success: true, message: 'Not a platform event' });
    }

    // Parse: "platform-{orgId}-{planId}"
    const parts = preapproval.external_reference.split('-');
    if (parts.length < 3) {
      console.error(`❌ Invalid platform external_reference: ${preapproval.external_reference}`);
      console.log('='.repeat(60) + '\n');
      return NextResponse.json({ success: true });
    }

    // orgId may contain hyphens (cuid format), so join everything between "platform-" and the last segment
    // Format is "platform-{cuid}-{planCuid}" — cuid has no hyphens, so parts[1] is orgId, parts[2] is planId
    const organizationId = parts[1];

    if (!organizationId) {
      console.error(`❌ Could not parse organizationId from: ${preapproval.external_reference}`);
      console.log('='.repeat(60) + '\n');
      return NextResponse.json({ success: true });
    }

    // Handle status changes
    if (preapproval.status === 'authorized') {
      await db.organization.update({
        where: { id: organizationId },
        data: { status: 'active' },
      });
      console.log(`✅ Organization ${organizationId} activated`);
    } else if (preapproval.status === 'cancelled' || preapproval.status === 'paused') {
      await db.organization.update({
        where: { id: organizationId },
        data: { status: 'suspended' },
      });
      console.log(`⛔ Organization ${organizationId} suspended (preapproval: ${preapproval.status})`);
    } else {
      console.log(`⏳ Preapproval status: ${preapproval.status} — no action taken`);
    }

    console.log('✅ Platform webhook processed');
    console.log('='.repeat(60) + '\n');

    return NextResponse.json({ success: true, message: 'Platform webhook processed' });
  } catch (error) {
    console.error('❌ Error processing platform webhook:', error);
    console.log('='.repeat(60) + '\n');
    // Return 200 to prevent MercadoPago from retrying indefinitely
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/webhooks/platform',
    description: 'Platform-level MercadoPago subscription webhook',
    events: ['subscription_preapproval.authorized', 'subscription_preapproval.cancelled'],
  });
}
