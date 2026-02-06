import { db } from '@/lib/db';
import { sendEmailWithLogging } from '@/lib/email/send-email';
import { PaymentOverdue } from '../../emails/payment-overdue';
import {
  calculatePenalty,
  GRACE_PERIOD_DAYS,
} from '@/lib/services/penalty.service';

/**
 * Apply penalties to overdue payments.
 *
 * Finds all payments that:
 * - Are past the grace period (dueDate + GRACE_PERIOD_DAYS < now)
 * - Have status 'pending' (not yet paid)
 * - Have penaltyFee = 0 (no penalty applied yet)
 *
 * For each matching payment:
 * 1. Calculate the penalty using the penalty service
 * 2. Update the payment record with penaltyFee and totalAmount
 * 3. Update the subscription status to 'past_due'
 * 4. Send a payment overdue notification email
 *
 * @returns Summary of penalties applied
 */
export async function applyPenalties(): Promise<{
  checked: number;
  applied: number;
  failed: number;
}> {
  console.log('💰 Starting penalty application check...');

  const now = new Date();

  // Calculate the cutoff date (payments due before this date are past grace period)
  const gracePeriodCutoff = new Date(now);
  gracePeriodCutoff.setDate(gracePeriodCutoff.getDate() - GRACE_PERIOD_DAYS);

  console.log(`📅 Looking for payments due before ${gracePeriodCutoff.toISOString()}`);

  // Find payments that are overdue and haven't been penalized yet
  const overduePayments = await db.payment.findMany({
    where: {
      status: 'pending',
      dueDate: {
        lt: gracePeriodCutoff,
      },
      penaltyFee: 0, // No penalty applied yet
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      subscription: {
        select: {
          id: true,
          gracePeriodEnd: true,
          plan: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  console.log(`📋 Found ${overduePayments.length} overdue payment(s) without penalties`);

  let applied = 0;
  let failed = 0;

  for (const payment of overduePayments) {
    try {
      console.log(`\n💳 Processing payment ${payment.id}`);
      console.log(`   User: ${payment.user.email}`);
      console.log(`   Due date: ${payment.dueDate.toISOString()}`);
      console.log(`   Amount: ${payment.amount}`);

      // Calculate penalty
      const penaltyResult = calculatePenalty({
        baseAmount: payment.amount,
        dueDate: payment.dueDate,
        paymentDate: now,
      });

      console.log(`   Days late: ${penaltyResult.daysLate}`);
      console.log(`   Penalty rate: ${(penaltyResult.penaltyRate * 100).toFixed(1)}%`);
      console.log(`   Penalty amount: ${penaltyResult.penaltyAmount}`);

      // Update payment with penalty
      const totalAmount = payment.amount + penaltyResult.penaltyAmount;
      await db.payment.update({
        where: { id: payment.id },
        data: {
          penaltyFee: penaltyResult.penaltyAmount,
          totalAmount,
        },
      });

      console.log(`   ✅ Payment updated with penalty`);

      // Update subscription status to past_due if not already
      // Also set gracePeriodEnd if not already set
      const gracePeriodEnd =
        payment.subscription.gracePeriodEnd ||
        new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

      await db.subscription.update({
        where: { id: payment.subscription.id },
        data: {
          status: 'past_due',
          gracePeriodEnd,
        },
      });

      console.log(`   ✅ Subscription marked as past_due`);

      // Send penalty notification email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const paymentUrl = `${appUrl}/subscription/pay`;

      const emailResult = await sendEmailWithLogging({
        userId: payment.user.id,
        type: 'payment_overdue',
        to: payment.user.email,
        subject: 'Pago vencido - Reservapp',
        template: PaymentOverdue({
          paymentUrl,
          name: payment.user.name,
          baseAmount: payment.amount,
          penaltyFee: penaltyResult.penaltyAmount,
          totalAmount,
          gracePeriodEnd,
          planName: payment.subscription.plan.name,
        }),
        metadata: {
          paymentId: payment.id,
          penaltyAmount: penaltyResult.penaltyAmount,
          daysLate: penaltyResult.daysLate,
        },
      });

      if (emailResult.success) {
        console.log(`   📧 Penalty notification email sent`);
      } else {
        console.error(`   ⚠️ Failed to send penalty notification: ${emailResult.error}`);
      }

      applied++;
    } catch (error) {
      console.error(`   ❌ Failed to apply penalty to payment ${payment.id}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Penalty application complete:`);
  console.log(`   Checked: ${overduePayments.length}`);
  console.log(`   Applied: ${applied}`);
  console.log(`   Failed: ${failed}`);

  return {
    checked: overduePayments.length,
    applied,
    failed,
  };
}

// Run as standalone script
if (require.main === module) {
  console.log('🚀 Running penalty application worker...');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   Timezone: ${process.env.TZ || 'system default'}`);

  applyPenalties()
    .then((result) => {
      console.log('🏁 Worker finished:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Worker failed:', error);
      process.exit(1);
    });
}
