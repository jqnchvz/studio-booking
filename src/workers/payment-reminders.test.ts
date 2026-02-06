import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkPaymentReminders } from './payment-reminders';
import { db } from '@/lib/db';
import * as emailModule from '@/lib/email/send-email';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    subscription: {
      findMany: vi.fn(),
    },
    emailLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email/send-email', () => ({
  sendEmailWithLogging: vi.fn(),
}));

vi.mock('../../emails/payment-reminder', () => ({
  PaymentReminder: vi.fn(() => '<div>Payment Reminder</div>'),
}));

describe('checkPaymentReminders', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockPlan = {
    name: 'Plan Premium',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should find subscriptions due in 7 days and send reminders', async () => {
    // Setup: subscription due in 7 days
    const now = new Date('2026-02-05T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-12T12:00:00.000Z');
    const mockSubscription = {
      id: 'sub-123',
      userId: 'user-123',
      nextBillingDate: dueDate,
      planPrice: 9990,
      user: mockUser,
      plan: mockPlan,
    };

    // Return subscription only for 7-day check, empty for others
    vi.mocked(db.subscription.findMany)
      .mockResolvedValueOnce([mockSubscription]) // 7-day check
      .mockResolvedValueOnce([]) // 3-day check
      .mockResolvedValueOnce([]); // 1-day check
    vi.mocked(db.emailLog.findFirst).mockResolvedValue(null); // No existing reminder
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: true,
      messageId: 'msg-123',
    });

    // Execute
    const result = await checkPaymentReminders();

    // Verify
    expect(db.subscription.findMany).toHaveBeenCalled();
    expect(emailModule.sendEmailWithLogging).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        type: 'payment_reminder',
        to: 'test@example.com',
        subject: 'Recordatorio de pago - Reservapp',
        metadata: expect.objectContaining({
          subscriptionId: 'sub-123',
          daysUntilDue: 7,
        }),
      })
    );
    expect(result.sent).toBe(1);
  });

  it('should find subscriptions due in 3 days and send reminders', async () => {
    // Setup: subscription due in 3 days
    const now = new Date('2026-02-05T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-08T12:00:00.000Z');
    const mockSubscription = {
      id: 'sub-456',
      userId: 'user-456',
      nextBillingDate: dueDate,
      planPrice: 19990,
      user: { ...mockUser, id: 'user-456', email: 'user2@example.com' },
      plan: mockPlan,
    };

    // Return nothing for 7-day check, one subscription for 3-day check
    vi.mocked(db.subscription.findMany)
      .mockResolvedValueOnce([]) // 7-day check
      .mockResolvedValueOnce([mockSubscription]) // 3-day check
      .mockResolvedValueOnce([]); // 1-day check

    vi.mocked(db.emailLog.findFirst).mockResolvedValue(null);
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: true,
      messageId: 'msg-456',
    });

    // Execute
    const result = await checkPaymentReminders();

    // Verify
    expect(emailModule.sendEmailWithLogging).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Tu pago vence en 3 dias - Reservapp',
        metadata: expect.objectContaining({
          daysUntilDue: 3,
        }),
      })
    );
    expect(result.sent).toBe(1);
  });

  it('should find subscriptions due in 1 day and send urgent reminders', async () => {
    // Setup: subscription due tomorrow
    const now = new Date('2026-02-05T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-06T12:00:00.000Z');
    const mockSubscription = {
      id: 'sub-789',
      userId: 'user-789',
      nextBillingDate: dueDate,
      planPrice: 29990,
      user: { ...mockUser, id: 'user-789', email: 'user3@example.com' },
      plan: mockPlan,
    };

    vi.mocked(db.subscription.findMany)
      .mockResolvedValueOnce([]) // 7-day check
      .mockResolvedValueOnce([]) // 3-day check
      .mockResolvedValueOnce([mockSubscription]); // 1-day check

    vi.mocked(db.emailLog.findFirst).mockResolvedValue(null);
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: true,
      messageId: 'msg-789',
    });

    // Execute
    const result = await checkPaymentReminders();

    // Verify
    expect(emailModule.sendEmailWithLogging).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Tu pago vence manana - Reservapp',
        metadata: expect.objectContaining({
          daysUntilDue: 1,
        }),
      })
    );
    expect(result.sent).toBe(1);
  });

  it('should skip subscriptions that already received a reminder today', async () => {
    // Setup
    const now = new Date('2026-02-05T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-12T12:00:00.000Z');
    const mockSubscription = {
      id: 'sub-123',
      userId: 'user-123',
      nextBillingDate: dueDate,
      planPrice: 9990,
      user: mockUser,
      plan: mockPlan,
    };

    // Return subscription only for 7-day check, empty for others
    vi.mocked(db.subscription.findMany)
      .mockResolvedValueOnce([mockSubscription]) // 7-day check
      .mockResolvedValueOnce([]) // 3-day check
      .mockResolvedValueOnce([]); // 1-day check
    // Existing reminder found
    vi.mocked(db.emailLog.findFirst).mockResolvedValue({
      id: 'log-123',
      userId: 'user-123',
      type: 'payment_reminder',
      recipient: 'test@example.com',
      subject: 'Recordatorio de pago',
      status: 'sent',
      error: null,
      metadata: { daysUntilDue: 7 },
      createdAt: now,
    });

    // Execute
    const result = await checkPaymentReminders();

    // Verify - no email should be sent
    expect(emailModule.sendEmailWithLogging).not.toHaveBeenCalled();
    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
  });

  it('should handle no subscriptions found', async () => {
    // Setup
    const now = new Date('2026-02-05T12:00:00.000Z');
    vi.setSystemTime(now);

    vi.mocked(db.subscription.findMany)
      .mockResolvedValueOnce([]) // 7-day check
      .mockResolvedValueOnce([]) // 3-day check
      .mockResolvedValueOnce([]); // 1-day check

    // Execute
    const result = await checkPaymentReminders();

    // Verify
    expect(result.checked).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(0);
    expect(emailModule.sendEmailWithLogging).not.toHaveBeenCalled();
  });

  it('should only find active subscriptions', async () => {
    // Setup
    const now = new Date('2026-02-05T12:00:00.000Z');
    vi.setSystemTime(now);

    vi.mocked(db.subscription.findMany)
      .mockResolvedValueOnce([]) // 7-day check
      .mockResolvedValueOnce([]) // 3-day check
      .mockResolvedValueOnce([]); // 1-day check

    // Execute
    await checkPaymentReminders();

    // Verify - should query for active subscriptions only
    expect(db.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'active',
        }),
      })
    );
  });

  it('should handle multiple subscriptions at once', async () => {
    // Setup: multiple subscriptions due in 7 days
    const now = new Date('2026-02-05T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-12T15:00:00.000Z');
    const mockSubscriptions = [
      {
        id: 'sub-1',
        userId: 'user-1',
        nextBillingDate: dueDate,
        planPrice: 9990,
        user: { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        plan: mockPlan,
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        nextBillingDate: dueDate,
        planPrice: 19990,
        user: { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
        plan: mockPlan,
      },
    ];

    vi.mocked(db.subscription.findMany)
      .mockResolvedValueOnce(mockSubscriptions) // 7-day check
      .mockResolvedValueOnce([]) // 3-day check
      .mockResolvedValueOnce([]); // 1-day check

    vi.mocked(db.emailLog.findFirst).mockResolvedValue(null);
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: true,
      messageId: 'msg-test',
    });

    // Execute
    const result = await checkPaymentReminders();

    // Verify
    expect(emailModule.sendEmailWithLogging).toHaveBeenCalledTimes(2);
    expect(result.sent).toBe(2);
    expect(result.checked).toBe(2);
  });

  it('should continue processing other subscriptions if one fails', async () => {
    // Setup
    const now = new Date('2026-02-05T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-12T15:00:00.000Z');
    const mockSubscriptions = [
      {
        id: 'sub-1',
        userId: 'user-1',
        nextBillingDate: dueDate,
        planPrice: 9990,
        user: { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        plan: mockPlan,
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        nextBillingDate: dueDate,
        planPrice: 19990,
        user: { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
        plan: mockPlan,
      },
    ];

    vi.mocked(db.subscription.findMany)
      .mockResolvedValueOnce(mockSubscriptions)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    vi.mocked(db.emailLog.findFirst).mockResolvedValue(null);
    vi.mocked(emailModule.sendEmailWithLogging)
      .mockRejectedValueOnce(new Error('Email failed')) // First fails
      .mockResolvedValueOnce({ success: true, messageId: 'msg-2' }); // Second succeeds

    // Execute
    const result = await checkPaymentReminders();

    // Verify - second email should still be sent
    expect(emailModule.sendEmailWithLogging).toHaveBeenCalledTimes(2);
    expect(result.sent).toBe(1); // Only one succeeded
  });
});
