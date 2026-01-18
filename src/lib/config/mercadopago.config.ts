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
   * Application URL
   * Used for success/failure redirect URLs
   */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
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
