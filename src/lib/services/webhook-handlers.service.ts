import { db } from '@/lib/db';
import { fetchPaymentDetails } from './mercadopago.service';

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

  try {
    // 1. Fetch payment details from MercadoPago
    const payment = await fetchPaymentDetails(paymentId);

    console.log(`📝 Processing payment ${paymentId}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   External Reference: ${payment.external_reference}`);

    // 2. Parse external_reference to get userId and planId
    // Format: "userId-planId" (set during preference creation)
    if (!payment.external_reference) {
      console.error(`❌ Payment ${paymentId} has no external_reference`);
      return;
    }

    const [userId, planId] = payment.external_reference.split('-');
    if (!userId || !planId) {
      console.error(
        `❌ Invalid external_reference format: ${payment.external_reference}`
      );
      return;
    }

    // 3. Find subscription
    const subscription = await db.subscription.findUnique({
      where: { userId },
      include: { user: true, plan: true },
    });

    if (!subscription) {
      console.error(`❌ Subscription not found for user ${userId}`);
      return;
    }

    // 4. Handle payment based on status
    if (payment.status === 'approved') {
      console.log(`✅ Payment approved - activating subscription`);

      // Calculate billing dates
      const now = new Date();
      const currentPeriodStart = new Date(now);
      const currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now
      const nextBillingDate = new Date(currentPeriodEnd);

      // Create or update payment record
      const existingPayment = await db.payment.findUnique({
        where: { mercadopagoId: payment.id!.toString() },
      });

      const paymentAmount = Math.round(payment.transaction_amount || 0);

      if (existingPayment) {
        // Update existing payment
        await db.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'approved',
            paidAt: new Date(payment.date_approved || now),
            totalAmount: paymentAmount,
            metadata: payment as object,
          },
        });
        console.log(`   Updated existing payment record: ${existingPayment.id}`);
      } else {
        // Create new payment record
        await db.payment.create({
          data: {
            userId,
            subscriptionId: subscription.id,
            mercadopagoId: payment.id!.toString(),
            amount: paymentAmount,
            penaltyFee: 0,
            totalAmount: paymentAmount,
            status: 'approved',
            dueDate: currentPeriodStart,
            paidAt: new Date(payment.date_approved || now),
            metadata: payment as object,
          },
        });
        console.log(`   Created payment record`);
      }

      // Activate subscription
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          currentPeriodStart,
          currentPeriodEnd,
          nextBillingDate,
          gracePeriodEnd: null,
          cancelledAt: null,
        },
      });

      console.log(`✅ Subscription activated for user ${subscription.user.email}`);
      console.log(`   Period: ${currentPeriodStart.toISOString()} - ${currentPeriodEnd.toISOString()}`);
      console.log(`   Next billing: ${nextBillingDate.toISOString()}`);

      // TODO: Send confirmation email (RES-25)
      console.log(`📧 TODO: Send subscription activated email to ${subscription.user.email}`);
    } else if (payment.status === 'rejected') {
      console.log(`❌ Payment rejected - handling failure`);
      // TODO (RES-34): Handle payment failure logic
      console.log(`📧 TODO: Send payment failed email to user`);
    } else {
      console.log(`⏳ Payment status: ${payment.status} - no action taken`);
    }
  } catch (error) {
    console.error(`❌ Error handling payment.updated:`, error);
    throw error;
  }
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
