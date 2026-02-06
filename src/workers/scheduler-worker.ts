import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '@/lib/queue/redis';
import { SCHEDULER_QUEUE_NAME, SchedulerJobData } from '@/lib/queue/scheduler-queue';
import { checkPaymentReminders } from './payment-reminders';
import { checkGracePeriods } from './check-grace-periods';
import { applyPenalties } from './apply-penalties';

/**
 * Process scheduled job
 */
async function processScheduledJob(job: Job<SchedulerJobData>): Promise<void> {
  console.log(`⏰ Processing scheduled job: ${job.name}`);
  console.log(`   Time: ${new Date().toISOString()}`);

  switch (job.name) {
    case 'check-payment-reminders':
      await checkPaymentReminders();
      break;

    case 'apply-penalties':
      await applyPenalties();
      break;

    case 'check-grace-periods':
      await checkGracePeriods();
      break;

    default:
      console.log(`   ⚠️ Unknown scheduled job: ${job.name}`);
  }
}

/**
 * Create and start the scheduler worker
 * Handles recurring scheduled jobs like payment reminders and grace period checks
 */
export function createSchedulerWorker(): Worker<SchedulerJobData> {
  const connection = createRedisConnection();

  const worker = new Worker<SchedulerJobData>(
    SCHEDULER_QUEUE_NAME,
    processScheduledJob,
    {
      connection,
      concurrency: 1, // Process scheduled jobs one at a time
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Scheduled job ${job.name} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Scheduled job ${job?.name} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ Scheduler worker error:', err);
  });

  console.log('⏰ Scheduler worker started');
  console.log('   Listening for: check-payment-reminders, apply-penalties, check-grace-periods');

  return worker;
}

// Run as standalone script
if (require.main === module) {
  console.log('🚀 Starting scheduler worker...');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   Timezone: ${process.env.TZ || 'system default'}`);

  const worker = createSchedulerWorker();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('📴 Shutting down scheduler worker...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('📴 Shutting down scheduler worker...');
    await worker.close();
    process.exit(0);
  });
}
