/**
 * Email Service Test Script (RES-25)
 *
 * Tests the Resend email service integration
 *
 * Prerequisites:
 * 1. RESEND_API_KEY configured in .env
 * 2. EMAIL_FROM configured in .env
 *
 * Usage:
 *   npx tsx scripts/test-email-service.ts <recipient-email>
 *
 * Example:
 *   npx tsx scripts/test-email-service.ts your.email@example.com
 */

import 'dotenv/config';
import { sendEmail } from '../src/lib/email/send-email';
import TestEmail from '../emails/test-email';

async function testEmailService() {
  console.log('🧪 Testing Email Service (RES-25)');
  console.log('='.repeat(60));

  // Get recipient email from command line args
  const recipientEmail = process.argv[2];

  if (!recipientEmail) {
    console.error('❌ Error: Please provide a recipient email address');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/test-email-service.ts <recipient-email>');
    console.log('\nExample:');
    console.log('  npx tsx scripts/test-email-service.ts your.email@example.com');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error(`❌ Error: Invalid email format: ${recipientEmail}`);
    process.exit(1);
  }

  console.log(`\n📧 Sending test email to: ${recipientEmail}`);
  console.log(`   From: ${process.env.EMAIL_FROM || 'noreply@yourdomain.com'}`);
  console.log(`   Subject: Email Service Test`);

  try {
    // Send test email
    const result = await sendEmail({
      to: recipientEmail,
      subject: 'Email Service Test - Reservapp',
      template: TestEmail({ name: 'Developer' }),
    });

    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('\n📬 Check your inbox for the test email.');
      console.log('   (Don\'t forget to check spam/junk folder)');
      process.exit(0);
    } else {
      console.error('\n❌ Failed to send email');
      console.error(`   Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run test
testEmailService().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
