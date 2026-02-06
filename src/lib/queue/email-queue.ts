import { Queue, QueueEvents } from 'bullmq';
import { redis } from './redis';

/**
 * Email queue name
 */
export const EMAIL_QUEUE_NAME = 'emails';

/**
 * Email job data structure
 */
export interface EmailJobData {
  userId?: string;
  type: string;
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, unknown>;
}

/**
 * Email queue for processing email jobs
 * Jobs are added to this queue and processed by the email worker
 */
export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 24 * 60 * 60, // Remove completed jobs older than 24 hours
    },
    removeOnFail: {
      count: 5000, // Keep last 5000 failed jobs for debugging
    },
  },
});

/**
 * Queue events for monitoring
 */
export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
  connection: redis,
});

// Log queue events
emailQueueEvents.on('completed', ({ jobId }) => {
  console.log(`✅ Email job ${jobId} completed`);
});

emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Email job ${jobId} failed: ${failedReason}`);
});

/**
 * Add an email job to the queue
 */
export async function queueEmail(data: EmailJobData, options?: { delay?: number }) {
  const job = await emailQueue.add('send-email', data, {
    delay: options?.delay,
  });
  console.log(`📧 Email job ${job.id} queued for ${data.to}`);
  return job;
}
