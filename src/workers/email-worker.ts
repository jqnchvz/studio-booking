import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '@/lib/queue/redis';
import { EMAIL_QUEUE_NAME, EmailJobData } from '@/lib/queue/email-queue';
import { sendEmailWithLogging, EmailType } from '@/lib/email/send-email';
import { PaymentReminder } from '../../emails/payment-reminder';
import { PaymentSuccess } from '../../emails/payment-success';
import { PaymentOverdue } from '../../emails/payment-overdue';
import { SubscriptionActivated } from '../../emails/subscription-activated';
import { SubscriptionSuspended } from '../../emails/subscription-suspended';
import { SubscriptionCancelled } from '../../emails/subscription-cancelled';
import { VerifyEmail } from '../../emails/verify-email';
import { PasswordReset } from '../../emails/password-reset';

/**
 * Map of template names to template functions
 */
const templates: Record<string, (data: Record<string, unknown>) => React.ReactElement> = {
  'payment-reminder': (data) =>
    PaymentReminder({
      paymentUrl: data.paymentUrl as string,
      name: data.name as string | undefined,
      amount: data.amount as number,
      dueDate: new Date(data.dueDate as string),
      daysUntilDue: data.daysUntilDue as number,
      planName: data.planName as string,
    }),
  'payment-success': (data) =>
    PaymentSuccess({
      name: data.name as string | undefined,
      amount: data.amount as number,
      planName: data.planName as string,
      paymentDate: new Date(data.paymentDate as string),
      paymentId: data.paymentId as string,
      nextBillingDate: new Date(data.nextBillingDate as string),
    }),
  'payment-overdue': (data) =>
    PaymentOverdue({
      paymentUrl: data.paymentUrl as string,
      name: data.name as string | undefined,
      baseAmount: data.baseAmount as number,
      penaltyFee: data.penaltyFee as number,
      totalAmount: data.totalAmount as number,
      gracePeriodEnd: new Date(data.gracePeriodEnd as string),
      planName: data.planName as string,
    }),
  'subscription-activated': (data) =>
    SubscriptionActivated({
      dashboardUrl: data.dashboardUrl as string,
      name: data.name as string | undefined,
      planName: data.planName as string,
      planPrice: data.planPrice as number,
      billingPeriod: data.billingPeriod as string,
      activatedAt: new Date(data.activatedAt as string),
    }),
  'subscription-suspended': (data) =>
    SubscriptionSuspended({
      paymentUrl: data.paymentUrl as string,
      name: data.name as string | undefined,
      planName: data.planName as string,
      suspendedAt: new Date(data.suspendedAt as string),
      reason: data.reason as 'payment_failed' | 'grace_period_expired',
      outstandingAmount: data.outstandingAmount as number | undefined,
    }),
  'subscription-cancelled': (data) =>
    SubscriptionCancelled({
      reactivateUrl: data.reactivateUrl as string,
      name: data.name as string | undefined,
      planName: data.planName as string,
      cancelledAt: new Date(data.cancelledAt as string),
      accessUntil: new Date(data.accessUntil as string),
    }),
  'verify-email': (data) =>
    VerifyEmail({
      verificationUrl: data.verificationUrl as string,
      email: data.email as string,
      name: data.name as string | undefined,
    }),
  'password-reset': (data) =>
    PasswordReset({
      resetUrl: data.resetUrl as string,
      email: data.email as string,
      name: data.name as string | undefined,
    }),
};

/**
 * Process email job
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { userId, type, to, subject, templateName, templateData } = job.data;

  console.log(`📧 Processing email job ${job.id}`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Template: ${templateName}`);

  const templateFn = templates[templateName];
  if (!templateFn) {
    throw new Error(`Unknown template: ${templateName}`);
  }

  const template = templateFn(templateData);

  const result = await sendEmailWithLogging({
    userId,
    type: type as EmailType,
    to,
    subject,
    template,
    metadata: {
      jobId: job.id,
      templateName,
      ...templateData,
    },
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }

  console.log(`✅ Email sent successfully: ${result.messageId}`);
}

/**
 * Create and start the email worker
 */
export function createEmailWorker(): Worker<EmailJobData> {
  const connection = createRedisConnection();

  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    processEmailJob,
    {
      connection,
      concurrency: 5, // Process up to 5 emails concurrently
      limiter: {
        max: 100, // Max 100 jobs
        duration: 60000, // per minute (Resend rate limit friendly)
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });

  console.log('📧 Email worker started');

  return worker;
}

// Run as standalone script
if (require.main === module) {
  console.log('🚀 Starting email worker...');
  console.log(`   Time: ${new Date().toISOString()}`);

  const worker = createEmailWorker();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('📴 Shutting down email worker...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('📴 Shutting down email worker...');
    await worker.close();
    process.exit(0);
  });
}
