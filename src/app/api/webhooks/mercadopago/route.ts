import { NextRequest, NextResponse } from 'next/server';
import {
  handleWebhookEvent,
  type MercadoPagoWebhookEvent,
} from '@/lib/services/webhook-handlers.service';
import {
  validateWebhookSignature,
  shouldSkipValidation,
} from '@/lib/services/mercadopago-webhook-validation';

/**
 * POST /api/webhooks/mercadopago
 * Receives webhook notifications from MercadoPago
 *
 * MercadoPago sends webhooks for payment and subscription events.
 * This endpoint validates the signature, stores the event, and processes it.
 *
 * Security:
 * - Validates x-signature header
 * - Checks timestamp freshness
 * - Implements idempotency via eventId
 *
 * Always returns 200 OK to prevent retries for application errors.
 */
export async function POST(request: NextRequest) {
  try {
    // Log webhook received
    console.log('\n' + '='.repeat(60));
    console.log('📨 MercadoPago Webhook Received');
    console.log('='.repeat(60));

    // Parse request body
    const body: MercadoPagoWebhookEvent = await request.json();

    // Extract headers
    const signature = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');

    console.log(`   Event ID: ${body.id}`);
    console.log(`   Type: ${body.type}`);
    console.log(`   Action: ${body.action}`);
    console.log(`   Resource ID: ${body.data.id}`);
    console.log(`   Request ID: ${requestId}`);

    // Validate webhook signature (security)
    if (!shouldSkipValidation()) {
      const isValid = validateWebhookSignature(
        signature,
        requestId,
        body.data.id,
        body.type
      );

      if (!isValid) {
        console.error('❌ Invalid webhook signature - rejecting');
        console.log('='.repeat(60) + '\n');

        // Return 401 for invalid signatures
        return NextResponse.json(
          {
            error: 'Invalid signature',
            message: 'Webhook signature validation failed',
          },
          { status: 401 }
        );
      }

      console.log('✅ Signature validated');
    } else {
      console.log('⚠️  Signature validation skipped (development mode)');
    }

    // Process webhook event
    await handleWebhookEvent(body);

    console.log('✅ Webhook processed successfully');
    console.log('='.repeat(60) + '\n');

    // Always return 200 OK to acknowledge receipt
    // Even if processing failed, we don't want MercadoPago to retry
    return NextResponse.json(
      {
        success: true,
        message: 'Webhook received and processed',
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error but still return 200 OK
    console.error('❌ Error processing webhook:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }

    console.log('='.repeat(60) + '\n');

    // Return 200 OK even on errors to prevent retries
    // The webhook event is stored, so we can manually retry if needed
    return NextResponse.json(
      {
        success: false,
        message: 'Webhook received but processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/webhooks/mercadopago
 * Returns webhook endpoint information (for testing/verification)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/webhooks/mercadopago',
    method: 'POST',
    description: 'MercadoPago webhook receiver',
    events: [
      'payment.created',
      'payment.updated',
      'subscription.created',
      'subscription.updated',
    ],
    security: {
      signatureValidation: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET),
      idempotency: true,
    },
  });
}
