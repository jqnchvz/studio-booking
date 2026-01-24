import { resend, emailConfig } from './client';
import { render } from '@react-email/render';
import { ReactElement } from 'react';

/**
 * Email send options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: ReactElement;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Email send result
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend and React Email templates
 *
 * @param options - Email configuration options
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome to Reservapp',
 *   template: <WelcomeEmail name="John" />
 * });
 *
 * if (result.success) {
 *   console.log('Email sent:', result.messageId);
 * }
 * ```
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    // Render React Email template to HTML
    const html = await render(options.template);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: options.from || emailConfig.from,
      to: options.to,
      subject: options.subject,
      html,
      replyTo: options.replyTo || emailConfig.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('✅ Email sent successfully:', data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('❌ Unexpected error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a simple text email without a template
 * Useful for quick notifications or testing
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param text - Plain text content
 * @returns Result indicating success or failure
 */
export async function sendTextEmail(
  to: string,
  subject: string,
  text: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to,
      subject,
      text,
    });

    if (error) {
      console.error('❌ Error sending text email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('✅ Text email sent successfully:', data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('❌ Unexpected error sending text email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
