import * as React from 'react';

interface VerifyEmailProps {
  verificationUrl: string;
  email: string;
  name?: string;
}

/**
 * Email verification template (placeholder)
 *
 * This is a basic template for email verification emails.
 * Will be enhanced with proper email styling in RES-65.
 *
 * For now, this serves as a reference for the email structure.
 */
export default function VerifyEmail({
  verificationUrl,
  email,
  name,
}: VerifyEmailProps) {
  return (
    <div>
      <h1>Verify your email address</h1>

      {name && <p>Hi {name},</p>}

      <p>
        Thanks for registering! Please verify your email address ({email}) by
        clicking the link below:
      </p>

      <a href={verificationUrl}>Verify Email Address</a>

      <p>
        Or copy and paste this URL into your browser:
        <br />
        {verificationUrl}
      </p>

      <p>This link will expire in 24 hours.</p>

      <p>
        If you didn't create an account, you can safely ignore this email.
      </p>

      <p>
        Best regards,
        <br />
        The Reservapp Team
      </p>
    </div>
  );
}

/**
 * Plain text version of the email
 */
export function verifyEmailText({
  verificationUrl,
  email,
  name,
}: VerifyEmailProps): string {
  return `
Verify your email address

${name ? `Hi ${name},\n\n` : ''}Thanks for registering! Please verify your email address (${email}) by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Reservapp Team
  `.trim();
}
