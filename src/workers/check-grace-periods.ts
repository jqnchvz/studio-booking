import { db } from '@/lib/db';

/**
 * Check for subscriptions with expired grace periods and suspend them.
 *
 * Finds all subscriptions that are `past_due` with a `gracePeriodEnd` in the past,
 * then transitions them to `suspended` and clears the grace period.
 *
 * Exported as a function for future BullMQ integration (RES-67).
 * Also runnable as a standalone script via `npx tsx src/workers/check-grace-periods.ts`.
 *
 * @returns Number of subscriptions that were suspended
 */
export async function checkGracePeriods(): Promise<number> {
  const now = new Date();

  console.log(`🔍 Checking for expired grace periods at ${now.toISOString()}`);

  // Find all past_due subscriptions whose grace period has expired
  const expiredSubscriptions = await db.subscription.findMany({
    where: {
      status: 'past_due',
      gracePeriodEnd: {
        lte: now,
      },
    },
    include: {
      user: { select: { email: true } },
    },
  });

  if (expiredSubscriptions.length === 0) {
    console.log(`✅ No expired grace periods found`);
    return 0;
  }

  console.log(`⚠️  Found ${expiredSubscriptions.length} subscription(s) with expired grace periods`);

  let suspendedCount = 0;

  for (const subscription of expiredSubscriptions) {
    try {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'suspended',
          gracePeriodEnd: null,
        },
      });

      suspendedCount++;
      console.log(`⛔ Suspended subscription ${subscription.id} for user ${subscription.user.email}`);
      console.log(`📧 TODO: Send grace period expired / suspension email to ${subscription.user.email}`);
    } catch (error) {
      console.error(`❌ Failed to suspend subscription ${subscription.id}:`, error);
    }
  }

  console.log(`✅ Grace period check complete: ${suspendedCount}/${expiredSubscriptions.length} subscriptions suspended`);
  return suspendedCount;
}

// Run as standalone script when executed directly
const isMainModule =
  typeof require !== 'undefined' && require.main === module;
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1]?.endsWith('check-grace-periods.ts');

if (isMainModule || isDirectRun) {
  checkGracePeriods()
    .then((count) => {
      console.log(`\nDone. Suspended ${count} subscription(s).`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error running grace period check:', error);
      process.exit(1);
    });
}
