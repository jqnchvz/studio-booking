import { Queue, QueueEvents } from 'bullmq';
import { redis } from './redis';

/**
 * Scheduler queue name
 */
export const SCHEDULER_QUEUE_NAME = 'scheduler';

/**
 * Scheduler job data structure
 */
export interface SchedulerJobData {
  // Empty data for scheduled jobs - the job name determines what to run
}

/**
 * Scheduler queue for recurring jobs
 * Jobs are scheduled with cron patterns and processed by the scheduler worker
 */
export const schedulerQueue = new Queue<SchedulerJobData>(SCHEDULER_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
});

/**
 * Queue events for monitoring
 */
export const schedulerQueueEvents = new QueueEvents(SCHEDULER_QUEUE_NAME, {
  connection: redis,
});

// Log queue events
schedulerQueueEvents.on('completed', ({ jobId }) => {
  console.log(`✅ Scheduler job ${jobId} completed`);
});

schedulerQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Scheduler job ${jobId} failed: ${failedReason}`);
});
