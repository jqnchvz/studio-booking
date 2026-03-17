import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/cron/cleanup
 *
 * Daily data retention cleanup job. Called by Railway Cron at 3am UTC.
 * Protected by CRON_SECRET bearer token.
 *
 * Deletes:
 * - EmailLog records older than 90 days
 * - WebhookEvent records that are processed and older than 30 days
 * - Pending drop-in reservations older than 30 minutes (free held slots)
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const [emailLogs, webhookEvents, staleDropins] = await Promise.all([
    db.emailLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    }),
    db.webhookEvent.deleteMany({
      where: { processed: true, createdAt: { lt: thirtyDaysAgo } },
    }),
    db.reservation.deleteMany({
      where: {
        type: 'dropin',
        status: 'pending',
        createdAt: { lt: thirtyMinutesAgo },
      },
    }),
  ]);

  console.log(
    `Cleanup: deleted ${emailLogs.count} email logs, ${webhookEvents.count} webhook events, ${staleDropins.count} stale drop-in reservations`
  );

  return NextResponse.json({
    emailLogs: emailLogs.count,
    webhookEvents: webhookEvents.count,
    staleDropins: staleDropins.count,
  });
}
