import { db } from '@/lib/db';
import { sendEmailWithLogging } from '@/lib/email/send-email';
import { PaymentReminder } from '../../emails/payment-reminder';

/**
 * Payment reminder intervals (days before due date)
 */
const REMINDER_DAYS = [7, 3, 1] as const;

/**
 * Get the start of a specific date (midnight)
 */
function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get the end of a specific date (23:59:59.999)
 */
function getEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Check if a reminder has already been sent for a subscription on a specific day
 */
async function hasReminderBeenSent(
  userId: string,
  daysUntilDue: number,
  dueDate: Date
): Promise<boolean> {
  const today = getStartOfDay(new Date());
  const todayEnd = getEndOfDay(new Date());

  // Check if we already sent a reminder for this due date and day count today
  const existingReminder = await db.emailLog.findFirst({
    where: {
      userId,
      type: 'payment_reminder',
      createdAt: {
        gte: today,
        lte: todayEnd,
      },
      metadata: {
        path: ['daysUntilDue'],
        equals: daysUntilDue,
      },
    },
  });

  return existingReminder !== null;
}

/**
 * Send payment reminder for a subscription
 */
async function sendPaymentReminder(
  subscription: {
    id: string;
    userId: string;
    nextBillingDate: Date;
    planPrice: number;
    user: { id: string; email: string; name: string };
    plan: { name: string };
  },
  daysUntilDue: number
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const paymentUrl = `${appUrl}/subscription/pay`;

  console.log(
    `  📧 Sending ${daysUntilDue}-day reminder to ${subscription.user.email}`
  );

  await sendEmailWithLogging({
    userId: subscription.user.id,
    type: 'payment_reminder',
    to: subscription.user.email,
    subject:
      daysUntilDue === 1
        ? 'Tu pago vence manana - Reservapp'
        : daysUntilDue === 3
          ? 'Tu pago vence en 3 dias - Reservapp'
          : 'Recordatorio de pago - Reservapp',
    template: PaymentReminder({
      paymentUrl,
      name: subscription.user.name,
      amount: subscription.planPrice,
      dueDate: subscription.nextBillingDate,
      daysUntilDue,
      planName: subscription.plan.name,
    }),
    metadata: {
      subscriptionId: subscription.id,
      daysUntilDue,
      dueDate: subscription.nextBillingDate.toISOString(),
    },
  });
}

/**
 * Check and send payment reminders for subscriptions
 * Finds subscriptions with billing dates in 7, 3, or 1 days
 * and sends appropriate reminders if not already sent
 *
 * @returns Summary of reminders sent
 */
export async function checkPaymentReminders(): Promise<{
  checked: number;
  sent: number;
  skipped: number;
}> {
  console.log('🔔 Starting payment reminder check...');

  const now = new Date();
  let checked = 0;
  let sent = 0;
  let skipped = 0;

  for (const daysUntilDue of REMINDER_DAYS) {
    // Calculate the target date range for this reminder
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysUntilDue);

    const targetStart = getStartOfDay(targetDate);
    const targetEnd = getEndOfDay(targetDate);

    console.log(
      `📅 Checking for ${daysUntilDue}-day reminders (due: ${targetStart.toDateString()})`
    );

    // Find active subscriptions with billing date in this range
    const subscriptions = await db.subscription.findMany({
      where: {
        status: 'active',
        nextBillingDate: {
          gte: targetStart,
          lte: targetEnd,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`  Found ${subscriptions.length} subscriptions`);
    checked += subscriptions.length;

    for (const subscription of subscriptions) {
      // Check if reminder was already sent today
      const alreadySent = await hasReminderBeenSent(
        subscription.userId,
        daysUntilDue,
        subscription.nextBillingDate
      );

      if (alreadySent) {
        console.log(
          `  ⏭️  Skipping ${subscription.user.email} - reminder already sent`
        );
        skipped++;
        continue;
      }

      try {
        await sendPaymentReminder(subscription, daysUntilDue);
        sent++;
      } catch (error) {
        console.error(
          `  ❌ Failed to send reminder to ${subscription.user.email}:`,
          error
        );
      }
    }
  }

  console.log(`✅ Payment reminder check complete:`);
  console.log(`   Checked: ${checked}`);
  console.log(`   Sent: ${sent}`);
  console.log(`   Skipped: ${skipped}`);

  return { checked, sent, skipped };
}

// Run as standalone script
if (require.main === module) {
  console.log('🚀 Running payment reminders worker...');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   Timezone: ${process.env.TZ || 'system default'}`);

  checkPaymentReminders()
    .then((result) => {
      console.log('🏁 Worker finished:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Worker failed:', error);
      process.exit(1);
    });
}
