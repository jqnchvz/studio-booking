import { MercadoPagoConfig, Payment, Preference, PreApproval } from 'mercadopago';
import {
  mercadopagoConfig,
  validateMercadoPagoConfig,
} from '../config/mercadopago.config';

/**
 * MercadoPago Client Instance
 * Singleton instance of MercadoPago SDK client
 */
let mercadopagoClient: MercadoPagoConfig | null = null;

/**
 * Initialize MercadoPago client with access token
 * @returns Initialized MercadoPago client
 * @throws Error if access token is not configured
 */
export function initializeMercadoPagoClient(): MercadoPagoConfig {
  if (mercadopagoClient) {
    return mercadopagoClient;
  }

  // Validate configuration
  validateMercadoPagoConfig();

  // Initialize client with access token
  mercadopagoClient = new MercadoPagoConfig({
    accessToken: mercadopagoConfig.accessToken,
    options: {
      timeout: 5000,
    },
  });

  console.log('✅ MercadoPago client initialized successfully');
  return mercadopagoClient;
}

/**
 * Get MercadoPago client instance
 * Initializes client if not already initialized
 * @returns MercadoPago client instance
 */
export function getMercadoPagoClient(): MercadoPagoConfig {
  if (!mercadopagoClient) {
    return initializeMercadoPagoClient();
  }
  return mercadopagoClient;
}

/**
 * Get Payment API instance
 * Used for querying payment status and details
 * @returns Payment API instance
 */
export function getPaymentAPI(): Payment {
  const client = getMercadoPagoClient();
  return new Payment(client);
}

/**
 * Get Preference API instance
 * Used for creating payment preferences (checkout links)
 * @returns Preference API instance
 */
export function getPreferenceAPI(): Preference {
  const client = getMercadoPagoClient();
  return new Preference(client);
}

/**
 * Get PreApproval API instance
 * Used for creating recurring payment subscriptions
 * @returns PreApproval API instance
 */
export function getPreApprovalAPI(): PreApproval {
  const client = getMercadoPagoClient();
  return new PreApproval(client);
}

/**
 * Create subscription preference for recurring monthly payments
 * @param planId - Subscription plan ID
 * @param userId - User ID
 * @param planPrice - Plan price in CLP
 * @param planName - Plan name for display
 * @param payerEmail - User's email address for MercadoPago
 * @returns Preference with init_point URL for checkout
 */
export async function createSubscriptionPreference(
  planId: string,
  userId: string,
  planPrice: number,
  planName: string,
  payerEmail: string
) {
  try {
    const preApprovalAPI = getPreApprovalAPI();

    // back_url is required by MercadoPago and must be a publicly accessible HTTPS URL
    // In production, use the real domain (e.g., https://reservapp.cl)
    // In development, use ngrok or a placeholder like https://google.com
    const backUrl = mercadopagoConfig.backUrl || mercadopagoConfig.appUrl;

    const requestBody = {
      reason: planName,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: planPrice,
        currency_id: mercadopagoConfig.currencyId,
      },
      back_url: backUrl,
      external_reference: `${userId}-${planId}`,
      payer_email: mercadopagoConfig.testPayerEmail || payerEmail,
    };

    const preApproval = await preApprovalAPI.create({ body: requestBody });

    console.log('✅ Subscription preference created:', preApproval.id);

    return {
      id: preApproval.id,
      init_point: preApproval.init_point,
      preferenceId: preApproval.id,
    };
  } catch (error) {
    console.error('❌ Error creating subscription preference:', error);
    throw error;
  }
}

/**
 * Fetch preapproval (subscription) status from MercadoPago
 * Used to verify payment status on callback return
 * @param preapprovalId - MercadoPago preapproval ID (stored as preferenceId)
 * @returns Preapproval details including status
 */
export async function getPreApprovalStatus(preapprovalId: string) {
  try {
    const preApprovalAPI = getPreApprovalAPI();
    const preApproval = await preApprovalAPI.get({ id: preapprovalId });

    console.log(`✅ Fetched preapproval status: ${preapprovalId}`);
    console.log(`   Status: ${preApproval.status}`);

    return preApproval;
  } catch (error) {
    console.error(`❌ Error fetching preapproval ${preapprovalId}:`, error);
    throw error;
  }
}

/**
 * Test MercadoPago connection
 * Verifies that credentials are valid and API is reachable
 * @returns Promise<boolean> - true if connection successful
 */
export async function testMercadoPagoConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing MercadoPago connection...');

    // Initialize client
    const client = getMercadoPagoClient();

    // Try to create a test preference to verify credentials
    const preferenceAPI = new Preference(client);

    // Create a minimal test preference (won't be used for actual payments)
    const testPreference = await preferenceAPI.create({
      body: {
        items: [
          {
            id: 'test-item',
            title: 'Test Connection',
            quantity: 1,
            unit_price: 100,
            currency_id: 'CLP',
          },
        ],
        back_urls: {
          success: `${mercadopagoConfig.appUrl}/test-success`,
          failure: `${mercadopagoConfig.appUrl}/test-failure`,
          pending: `${mercadopagoConfig.appUrl}/test-pending`,
        },
        // Don't use auto_return for test preference
        // auto_return: 'approved',
      },
    });

    if (testPreference.id) {
      console.log('✅ MercadoPago connection successful!');
      console.log(`   Test Preference ID: ${testPreference.id}`);
      return true;
    }

    console.error('❌ MercadoPago connection failed: No preference ID returned');
    return false;
  } catch (error) {
    console.error('❌ MercadoPago connection test failed:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return false;
  }
}

/**
 * Get MercadoPago public key for frontend use
 * @returns MercadoPago public key
 */
export function getMercadoPagoPublicKey(): string {
  return mercadopagoConfig.publicKey;
}

/**
 * Fetch payment details from MercadoPago API
 * @param paymentId - MercadoPago payment ID
 * @returns Payment details from MercadoPago
 */
export async function fetchPaymentDetails(paymentId: string) {
  try {
    const paymentAPI = getPaymentAPI();
    const payment = await paymentAPI.get({ id: paymentId });

    console.log(`✅ Fetched payment details: ${paymentId}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Amount: ${payment.transaction_amount} ${payment.currency_id}`);

    return payment;
  } catch (error) {
    console.error(`❌ Error fetching payment ${paymentId}:`, error);
    throw error;
  }
}

/**
 * Cancel a subscription in MercadoPago
 * @param subscriptionId - MercadoPago preapproval/subscription ID
 * @returns Cancellation result
 * @throws Error if cancellation fails
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    console.log(`🔄 Cancelling subscription: ${subscriptionId}`);

    const preApprovalAPI = getPreApprovalAPI();

    // Cancel the preapproval (subscription) in MercadoPago
    const result = await preApprovalAPI.update({
      id: subscriptionId,
      body: {
        status: 'cancelled',
      },
    });

    console.log(`✅ Subscription cancelled in MercadoPago: ${subscriptionId}`);
    console.log(`   Status: ${result.status}`);

    return result;
  } catch (error) {
    console.error(`❌ Error cancelling subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Update subscription amount in MercadoPago
 * @param subscriptionId - MercadoPago preapproval/subscription ID
 * @param newAmount - New monthly amount in CLP
 * @returns Update result
 * @throws Error if update fails
 */
export async function updateSubscriptionAmount(
  subscriptionId: string,
  newAmount: number
) {
  try {
    console.log(`🔄 Updating subscription amount: ${subscriptionId}`);
    console.log(`   New amount: ${newAmount} CLP`);

    const preApprovalAPI = getPreApprovalAPI();

    // Update the preapproval amount in MercadoPago
    const result = await preApprovalAPI.update({
      id: subscriptionId,
      body: {
        auto_recurring: {
          transaction_amount: newAmount,
          currency_id: 'CLP',
        },
      },
    });

    console.log(`✅ Subscription amount updated in MercadoPago: ${subscriptionId}`);
    console.log(`   New amount: ${newAmount} CLP`);

    return result;
  } catch (error) {
    console.error(`❌ Error updating subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Create a one-time payment preference for overdue payment with penalty
 * Used when user needs to pay outstanding balance including late fees
 *
 * @param paymentId - Internal payment record ID
 * @param userId - User ID
 * @param totalAmount - Total amount including penalty (in CLP)
 * @param planName - Plan name for display
 * @returns Preference with init_point URL for checkout
 */
export async function createOverduePaymentPreference(
  paymentId: string,
  userId: string,
  totalAmount: number,
  planName: string
) {
  try {
    console.log(`💳 Creating overdue payment preference`);
    console.log(`   Payment ID: ${paymentId}`);
    console.log(`   Amount: ${totalAmount} CLP`);

    const preferenceAPI = getPreferenceAPI();

    const preference = await preferenceAPI.create({
      body: {
        items: [
          {
            id: paymentId,
            title: `Pago vencido - ${planName}`,
            description: `Pago de suscripción con recargo por mora`,
            quantity: 1,
            unit_price: totalAmount,
            currency_id: 'CLP',
          },
        ],
        // external_reference links the preference to our internal payment record
        // Format: "overdue-{paymentId}-{userId}" to distinguish from subscription payments
        external_reference: `overdue-${paymentId}-${userId}`,
        back_urls: {
          success: `${mercadopagoConfig.appUrl}/subscription/callback/success`,
          failure: `${mercadopagoConfig.appUrl}/subscription/callback/failure`,
          pending: `${mercadopagoConfig.appUrl}/subscription/callback/pending`,
        },
        auto_return: 'approved',
        notification_url: `${mercadopagoConfig.appUrl}/api/webhooks/mercadopago`,
      },
    });

    console.log(`✅ Overdue payment preference created: ${preference.id}`);

    return {
      id: preference.id,
      init_point: preference.init_point,
    };
  } catch (error) {
    console.error('❌ Error creating overdue payment preference:', error);
    throw error;
  }
}
