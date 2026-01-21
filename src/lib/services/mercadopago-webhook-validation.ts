import crypto from 'crypto';

/**
 * Validate MercadoPago webhook signature
 *
 * MercadoPago sends webhooks with an x-signature header that includes:
 * - ts: timestamp
 * - v1: HMAC SHA256 signature
 *
 * Format: "ts=<timestamp>,v1=<signature>"
 *
 * The signature is calculated as:
 * HMAC_SHA256(webhook_secret, "id=<data.id>&type=<type>&ts=<timestamp>")
 *
 * @param signature - x-signature header value
 * @param requestId - x-request-id header value
 * @param dataId - data.id from webhook body
 * @param eventType - type from webhook body
 * @returns true if signature is valid
 */
export function validateWebhookSignature(
  signature: string | null,
  requestId: string | null,
  dataId: string,
  eventType: string
): boolean {
  // Get webhook secret from environment
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ MERCADOPAGO_WEBHOOK_SECRET not configured');
    return false;
  }

  if (!signature) {
    console.error('❌ Missing x-signature header');
    return false;
  }

  try {
    // Parse signature header
    // Format: "ts=1234567890,v1=abc123..."
    const parts = signature.split(',');
    let timestamp: string | null = null;
    let hash: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') {
        timestamp = value;
      } else if (key === 'v1') {
        hash = value;
      }
    }

    if (!timestamp || !hash) {
      console.error('❌ Invalid signature format');
      return false;
    }

    // Check timestamp freshness (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const signatureAge = now - parseInt(timestamp, 10);
    if (signatureAge > 300) {
      // 5 minutes
      console.error(`❌ Signature too old: ${signatureAge}s`);
      return false;
    }

    // Build manifest string
    // Format: "id=<data.id>&type=<type>&ts=<timestamp>"
    const manifest = `id=${dataId}&type=${eventType}&ts=${timestamp}`;

    // Calculate expected signature
    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(manifest)
      .digest('hex');

    // Compare signatures
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(expectedHash)
    );

    if (!isValid) {
      console.error('❌ Signature mismatch');
      console.error(`   Manifest: ${manifest}`);
      console.error(`   Expected: ${expectedHash}`);
      console.error(`   Received: ${hash}`);
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error validating signature:', error);
    return false;
  }
}

/**
 * In development, allow skipping signature validation if webhook secret not configured
 * @returns true if in development mode and secret not configured
 */
export function shouldSkipValidation(): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasSecret = Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET);

  return isDevelopment && !hasSecret;
}
