import { Resend } from 'resend';

/**
 * Resend Email Client
 * Singleton instance for sending emails via Resend API
 */

let resendInstance: Resend | null = null;

/**
 * Get or create the Resend client instance
 * Lazy initialization to avoid errors during build time
 */
function getResendClient(): Resend {
  if (!resendInstance) {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      throw new Error(
        'RESEND_API_KEY is not defined in environment variables. ' +
          'Please add it to your .env file.'
      );
    }

    resendInstance = new Resend(resendApiKey);
  }

  return resendInstance;
}

/**
 * Resend client instance
 * Configured with API key from environment
 */
export const resend = {
  get emails() {
    return getResendClient().emails;
  },
};

/**
 * Default email sender address
 * Should be configured in environment variables
 */
export const defaultFrom =
  process.env.EMAIL_FROM || 'noreply@yourdomain.com';

/**
 * Email configuration
 */
export const emailConfig = {
  from: defaultFrom,
  replyTo: process.env.EMAIL_REPLY_TO,
} as const;
