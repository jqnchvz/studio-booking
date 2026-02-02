/**
 * MercadoPago Configuration
 * Environment variables for MercadoPago integration (Chile)
 */

export const mercadopagoConfig = {
  /**
   * MercadoPago Access Token
   * Get from: https://www.mercadopago.cl/developers/panel/app
   * Use TEST token for development, PROD token for production
   */
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',

  /**
   * MercadoPago Public Key
   * Used for frontend checkout integration
   */
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',

  /**
   * Webhook Secret for signature validation
   * Used to verify webhook requests are from MercadoPago
   */
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',

  /**
   * Application URL (server-side)
   * Used for internal API calls
   * Note: Use APP_URL (not NEXT_PUBLIC_APP_URL) for server-side API routes
   */
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  /**
   * MercadoPago Back URL (must be publicly accessible HTTPS)
   * Used as redirect URL after payment in MercadoPago checkout
   * For local dev: use ngrok (e.g., https://abc123.ngrok-free.app)
   * For production: use the real domain (e.g., https://reservapp.cl)
   */
  backUrl: process.env.MERCADOPAGO_BACK_URL || '',

  /**
   * Currency ID for MercadoPago transactions
   * Must match the country of the MercadoPago account
   * CLP = Chile, ARS = Argentina, BRL = Brazil, MXN = Mexico
   */
  currencyId: process.env.MERCADOPAGO_CURRENCY_ID || 'CLP',

  /**
   * Test payer email override (development only)
   * When set, uses this email instead of the app user's email for payer_email
   * This decouples app authentication from MercadoPago payment identity
   * Leave empty in production — user's app email will be used as a hint
   */
  testPayerEmail: process.env.MERCADOPAGO_TEST_PAYER_EMAIL || '',
} as const;

/**
 * Validate that all required MercadoPago environment variables are set
 * @throws Error if any required variable is missing
 */
export function validateMercadoPagoConfig() {
  const missing: string[] = [];

  if (!mercadopagoConfig.accessToken) {
    missing.push('MERCADOPAGO_ACCESS_TOKEN');
  }
  if (!mercadopagoConfig.publicKey) {
    missing.push('MERCADOPAGO_PUBLIC_KEY');
  }
  if (!mercadopagoConfig.webhookSecret) {
    missing.push('MERCADOPAGO_WEBHOOK_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required MercadoPago environment variables: ${missing.join(', ')}`
    );
  }
}
