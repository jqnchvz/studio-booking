import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
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
