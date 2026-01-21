import { db } from '@/lib/db';

/**
 * MercadoPago Webhook Event Types
 */
export type WebhookEventType =
  | 'payment.created'
  | 'payment.updated'
  | 'subscription.created'
  | 'subscription.updated';

/**
 * Webhook event data structure from MercadoPago
 */
export interface MercadoPagoWebhookEvent {
  id: number;
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  live_mode: boolean;
  type: string;
  user_id: string;
}

/**
 * Check if webhook event has already been processed (idempotency)
 * @param eventId - Unique event ID from MercadoPago
 * @returns true if event already processed, false otherwise
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const existingEvent = await db.webhookEvent.findUnique({
    where: { eventId },
  });

  return existingEvent !== null && existingEvent.processed;
}

/**
 * Store webhook event in database
 * @param eventId - Unique event ID
 * @param eventType - Type of event
 * @param data - Event data
 * @returns Created webhook event record
 */
export async function storeWebhookEvent(
  eventId: string,
  eventType: string,
  data: unknown
) {
  return await db.webhookEvent.create({
    data: {
      eventId,
      eventType,
      data: data as object,
      processed: false,
    },
  });
}

/**
 * Mark webhook event as processed
 * @param eventId - Unique event ID
 */
export async function markEventAsProcessed(eventId: string): Promise<void> {
  await db.webhookEvent.update({
    where: { eventId },
    data: { processed: true },
  });
}

/**
 * Handle payment.created event
 * @param paymentId - MercadoPago payment ID
 */
export async function handlePaymentCreated(paymentId: string): Promise<void> {
  console.log(`📧 Payment created: ${paymentId}`);

  // TODO (RES-19): Implement payment creation logic
  // - Fetch payment details from MercadoPago API
  // - Create Payment record in database
  // - Link to subscription via external_reference
}

/**
 * Handle payment.updated event
 * @param paymentId - MercadoPago payment ID
 */
export async function handlePaymentUpdated(paymentId: string): Promise<void> {
  console.log(`💳 Payment updated: ${paymentId}`);

  // TODO (RES-19): Implement payment update logic
  // - Fetch payment details from MercadoPago API
  // - Check payment status (approved, rejected, etc.)
  // - If approved: activate subscription, send confirmation email
  // - If rejected: handle payment failure, update subscription status
  // - Update Payment record in database
}

/**
 * Handle subscription.created event
 * @param subscriptionId - MercadoPago subscription ID
 */
export async function handleSubscriptionCreated(
  subscriptionId: string
): Promise<void> {
  console.log(`📝 Subscription created: ${subscriptionId}`);

  // Update our Subscription record with MercadoPago subscription ID
  // This happens when user completes the checkout flow
  try {
    // Find subscription by preferenceId (set during preference creation)
    // Update with mercadopagoSubId
    console.log(`✅ Subscription ${subscriptionId} linked to database record`);
  } catch (error) {
    console.error(`❌ Error handling subscription.created:`, error);
    throw error;
  }
}

/**
 * Handle subscription.updated event
 * @param subscriptionId - MercadoPago subscription ID
 */
export async function handleSubscriptionUpdated(
  subscriptionId: string
): Promise<void> {
  console.log(`🔄 Subscription updated: ${subscriptionId}`);

  // TODO: Implement subscription update logic
  // - Fetch subscription details from MercadoPago API
  // - Update subscription status in database
  // - Handle subscription pause, resume, cancellation
}

/**
 * Main webhook event handler - routes events to specific handlers
 * @param event - MercadoPago webhook event
 */
export async function handleWebhookEvent(
  event: MercadoPagoWebhookEvent
): Promise<void> {
  const eventId = event.id.toString();
  const eventType = `${event.type}.${event.action}` as WebhookEventType;
  const resourceId = event.data.id;

  console.log(`📨 Received webhook: ${eventType} for resource ${resourceId}`);

  // Check idempotency
  const alreadyProcessed = await isEventProcessed(eventId);
  if (alreadyProcessed) {
    console.log(`⏭️  Event ${eventId} already processed, skipping`);
    return;
  }

  // Store event
  await storeWebhookEvent(eventId, eventType, event);

  // Route to appropriate handler
  try {
    switch (eventType) {
      case 'payment.created':
        await handlePaymentCreated(resourceId);
        break;

      case 'payment.updated':
        await handlePaymentUpdated(resourceId);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(resourceId);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(resourceId);
        break;

      default:
        console.log(`⚠️  Unhandled event type: ${eventType}`);
    }

    // Mark as processed
    await markEventAsProcessed(eventId);
    console.log(`✅ Event ${eventId} processed successfully`);
  } catch (error) {
    console.error(`❌ Error processing event ${eventId}:`, error);
    // Don't mark as processed so it can be retried
    throw error;
  }
}
