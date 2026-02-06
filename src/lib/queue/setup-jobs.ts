import { schedulerQueue } from './scheduler-queue';

/**
 * Setup recurring jobs for the application
 *
 * Jobs:
 * - check-payment-reminders: Daily at 9 AM Chile time
 * - check-grace-periods: Daily at 10 AM Chile time (for subscription suspension)
 */
export async function setupJobs(): Promise<void> {
  console.log('🔧 Setting up scheduled jobs...');

  // Remove existing repeatable jobs to avoid duplicates
  const existingJobs = await schedulerQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await schedulerQueue.removeRepeatableByKey(job.key);
    console.log(`   Removed existing job: ${job.name}`);
  }

  // Payment reminders - daily at 9 AM Chile time
  await schedulerQueue.add(
    'check-payment-reminders',
    {},
    {
      repeat: {
        pattern: '0 9 * * *', // 9:00 AM every day
        tz: 'America/Santiago',
      },
      jobId: 'payment-reminders-daily',
    }
  );
  console.log('   ✅ Scheduled: check-payment-reminders (9 AM Chile time)');

  // Grace period check - daily at 10 AM Chile time
  await schedulerQueue.add(
    'check-grace-periods',
    {},
    {
      repeat: {
        pattern: '0 10 * * *', // 10:00 AM every day
        tz: 'America/Santiago',
      },
      jobId: 'grace-periods-daily',
    }
  );
  console.log('   ✅ Scheduled: check-grace-periods (10 AM Chile time)');

  console.log('🎉 All scheduled jobs configured');
}

/**
 * List current scheduled jobs
 */
export async function listScheduledJobs(): Promise<void> {
  const jobs = await schedulerQueue.getRepeatableJobs();

  console.log('\n📋 Current scheduled jobs:');
  if (jobs.length === 0) {
    console.log('   No scheduled jobs found');
    return;
  }

  for (const job of jobs) {
    console.log(`   - ${job.name}`);
    console.log(`     Pattern: ${job.pattern}`);
    console.log(`     Timezone: ${job.tz || 'UTC'}`);
    console.log(`     Next run: ${job.next ? new Date(job.next).toISOString() : 'N/A'}`);
  }
}

// Run as standalone script
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'list') {
    listScheduledJobs()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Error listing jobs:', error);
        process.exit(1);
      });
  } else {
    setupJobs()
      .then(() => {
        console.log('\n');
        return listScheduledJobs();
      })
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Error setting up jobs:', error);
        process.exit(1);
      });
  }
}
