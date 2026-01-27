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
      idempotencyKey: 'studio-booking',
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
 * @returns Preference with init_point URL for checkout
 */
export async function createSubscriptionPreference(
  planId: string,
  userId: string,
  planPrice: number,
  planName: string
) {
  try {
    const preApprovalAPI = getPreApprovalAPI();

    // Calculate period dates
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now

    // Create preapproval for recurring payment
    const preApproval = await preApprovalAPI.create({
      body: {
        reason: planName,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: planPrice,
          currency_id: 'CLP',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
        back_url: `${mercadopagoConfig.appUrl}/subscriptions/success`,
        external_reference: `${userId}-${planId}`,
        payer_email: undefined, // Will be filled by user during checkout
        status: 'pending',
      },
    });

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
