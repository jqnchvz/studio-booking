import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyPenalties } from './apply-penalties';
import { db } from '@/lib/db';
import * as emailModule from '@/lib/email/send-email';
import * as penaltyModule from '@/lib/services/penalty.service';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    payment: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email/send-email', () => ({
  sendEmailWithLogging: vi.fn(),
}));

vi.mock('../../emails/payment-overdue', () => ({
  PaymentOverdue: vi.fn(() => '<div>Payment Overdue</div>'),
}));

describe('applyPenalties', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockPlan = {
    name: 'Plan Premium',
  };

  const mockSubscription = {
    id: 'sub-123',
    gracePeriodEnd: null,
    plan: mockPlan,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should find overdue payments and apply penalties', async () => {
    // Setup: payment due 5 days ago (past 2-day grace period)
    const now = new Date('2026-02-10T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-05T12:00:00.000Z'); // 5 days ago
    const mockPayment = {
      id: 'pay-123',
      userId: 'user-123',
      amount: 10000,
      penaltyFee: 0,
      totalAmount: 10000,
      status: 'pending',
      dueDate,
      user: mockUser,
      subscription: mockSubscription,
    };

    vi.mocked(db.payment.findMany).mockResolvedValue([mockPayment] as any);
    vi.mocked(db.payment.update).mockResolvedValue({} as any);
    vi.mocked(db.subscription.update).mockResolvedValue({} as any);
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: true,
      messageId: 'msg-123',
    });

    // Execute
    const result = await applyPenalties();

    // Verify - penalty should be calculated and applied
    expect(db.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'pending',
          dueDate: {
            lt: expect.any(Date), // Grace period cutoff
          },
          penaltyFee: 0,
        },
      })
    );

    expect(db.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-123' },
      data: {
        penaltyFee: expect.any(Number),
        totalAmount: expect.any(Number),
      },
    });

    expect(db.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-123' },
      data: {
        status: 'past_due',
        gracePeriodEnd: expect.any(Date),
      },
    });

    expect(emailModule.sendEmailWithLogging).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        type: 'payment_overdue',
        to: 'test@example.com',
        subject: 'Pago vencido - Reservapp',
      })
    );

    expect(result.applied).toBe(1);
    expect(result.checked).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should calculate correct penalty based on days late', async () => {
    // Setup: payment due 7 days ago (5 days late after 2-day grace period)
    const now = new Date('2026-02-10T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-03T12:00:00.000Z'); // 7 days ago
    const mockPayment = {
      id: 'pay-123',
      userId: 'user-123',
      amount: 10000, // 10000 CLP
      penaltyFee: 0,
      totalAmount: 10000,
      status: 'pending',
      dueDate,
      user: mockUser,
      subscription: mockSubscription,
    };

    vi.mocked(db.payment.findMany).mockResolvedValue([mockPayment] as any);
    vi.mocked(db.payment.update).mockResolvedValue({} as any);
    vi.mocked(db.subscription.update).mockResolvedValue({} as any);
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: true,
      messageId: 'msg-123',
    });

    // Execute
    await applyPenalties();

    // Verify penalty calculation
    // 5 days late = 5% base + (5 * 0.5%) daily = 7.5% penalty
    // 10000 * 0.075 = 750 CLP
    const expectedPenalty = penaltyModule.calculatePenalty({
      baseAmount: 10000,
      dueDate,
      paymentDate: now,
    });

    expect(db.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-123' },
      data: {
        penaltyFee: expectedPenalty.penaltyAmount,
        totalAmount: 10000 + expectedPenalty.penaltyAmount,
      },
    });
  });

  it('should skip payments that already have a penalty', async () => {
    // Setup
    const now = new Date('2026-02-10T12:00:00.000Z');
    vi.setSystemTime(now);

    // No payments returned because penaltyFee = 0 filter excludes them
    vi.mocked(db.payment.findMany).mockResolvedValue([]);

    // Execute
    const result = await applyPenalties();

    // Verify
    expect(result.checked).toBe(0);
    expect(result.applied).toBe(0);
    expect(db.payment.update).not.toHaveBeenCalled();
    expect(emailModule.sendEmailWithLogging).not.toHaveBeenCalled();
  });

  it('should skip payments within grace period', async () => {
    // Setup: payment due 1 day ago (within 2-day grace period)
    const now = new Date('2026-02-10T12:00:00.000Z');
    vi.setSystemTime(now);

    // Payments within grace period won't be returned by the query
    vi.mocked(db.payment.findMany).mockResolvedValue([]);

    // Execute
    const result = await applyPenalties();

    // Verify
    expect(result.checked).toBe(0);
    expect(result.applied).toBe(0);
  });

  it('should preserve existing gracePeriodEnd if already set', async () => {
    // Setup
    const now = new Date('2026-02-10T12:00:00.000Z');
    vi.setSystemTime(now);

    const existingGracePeriodEnd = new Date('2026-02-11T12:00:00.000Z');
    const dueDate = new Date('2026-02-05T12:00:00.000Z');
    const mockPayment = {
      id: 'pay-123',
      userId: 'user-123',
      amount: 10000,
      penaltyFee: 0,
      totalAmount: 10000,
      status: 'pending',
      dueDate,
      user: mockUser,
      subscription: {
        ...mockSubscription,
        gracePeriodEnd: existingGracePeriodEnd,
      },
    };

    vi.mocked(db.payment.findMany).mockResolvedValue([mockPayment] as any);
    vi.mocked(db.payment.update).mockResolvedValue({} as any);
    vi.mocked(db.subscription.update).mockResolvedValue({} as any);
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: true,
      messageId: 'msg-123',
    });

    // Execute
    await applyPenalties();

    // Verify - should use existing gracePeriodEnd
    expect(db.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-123' },
      data: {
        status: 'past_due',
        gracePeriodEnd: existingGracePeriodEnd,
      },
    });
  });

  it('should handle multiple overdue payments', async () => {
    // Setup
    const now = new Date('2026-02-10T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-05T12:00:00.000Z');
    const mockPayments = [
      {
        id: 'pay-1',
        userId: 'user-1',
        amount: 10000,
        penaltyFee: 0,
        totalAmount: 10000,
        status: 'pending',
        dueDate,
        user: { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        subscription: { id: 'sub-1', gracePeriodEnd: null, plan: mockPlan },
      },
      {
        id: 'pay-2',
        userId: 'user-2',
        amount: 20000,
        penaltyFee: 0,
        totalAmount: 20000,
        status: 'pending',
        dueDate,
        user: { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
        subscription: { id: 'sub-2', gracePeriodEnd: null, plan: mockPlan },
      },
    ];

    vi.mocked(db.payment.findMany).mockResolvedValue(mockPayments as any);
    vi.mocked(db.payment.update).mockResolvedValue({} as any);
    vi.mocked(db.subscription.update).mockResolvedValue({} as any);
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: true,
      messageId: 'msg-test',
    });

    // Execute
    const result = await applyPenalties();

    // Verify
    expect(db.payment.update).toHaveBeenCalledTimes(2);
    expect(db.subscription.update).toHaveBeenCalledTimes(2);
    expect(emailModule.sendEmailWithLogging).toHaveBeenCalledTimes(2);
    expect(result.checked).toBe(2);
    expect(result.applied).toBe(2);
  });

  it('should continue processing if one payment fails', async () => {
    // Setup
    const now = new Date('2026-02-10T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-05T12:00:00.000Z');
    const mockPayments = [
      {
        id: 'pay-1',
        userId: 'user-1',
        amount: 10000,
        penaltyFee: 0,
        totalAmount: 10000,
        status: 'pending',
        dueDate,
        user: { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        subscription: { id: 'sub-1', gracePeriodEnd: null, plan: mockPlan },
      },
      {
        id: 'pay-2',
        userId: 'user-2',
        amount: 20000,
        penaltyFee: 0,
        totalAmount: 20000,
        status: 'pending',
        dueDate,
        user: { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
        subscription: { id: 'sub-2', gracePeriodEnd: null, plan: mockPlan },
      },
    ];

    vi.mocked(db.payment.findMany).mockResolvedValue(mockPayments as any);
    vi.mocked(db.payment.update)
      .mockRejectedValueOnce(new Error('Database error')) // First fails
      .mockResolvedValueOnce({} as any); // Second succeeds
    vi.mocked(db.subscription.update).mockResolvedValue({} as any);
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: true,
      messageId: 'msg-test',
    });

    // Execute
    const result = await applyPenalties();

    // Verify - second payment should still be processed
    expect(result.checked).toBe(2);
    expect(result.applied).toBe(1);
    expect(result.failed).toBe(1);
  });

  it('should handle email send failure gracefully', async () => {
    // Setup
    const now = new Date('2026-02-10T12:00:00.000Z');
    vi.setSystemTime(now);

    const dueDate = new Date('2026-02-05T12:00:00.000Z');
    const mockPayment = {
      id: 'pay-123',
      userId: 'user-123',
      amount: 10000,
      penaltyFee: 0,
      totalAmount: 10000,
      status: 'pending',
      dueDate,
      user: mockUser,
      subscription: mockSubscription,
    };

    vi.mocked(db.payment.findMany).mockResolvedValue([mockPayment] as any);
    vi.mocked(db.payment.update).mockResolvedValue({} as any);
    vi.mocked(db.subscription.update).mockResolvedValue({} as any);
    vi.mocked(emailModule.sendEmailWithLogging).mockResolvedValue({
      success: false,
      error: 'Email failed',
    });

    // Execute
    const result = await applyPenalties();

    // Verify - penalty should still be applied even if email fails
    expect(db.payment.update).toHaveBeenCalled();
    expect(db.subscription.update).toHaveBeenCalled();
    expect(result.applied).toBe(1); // Penalty was applied despite email failure
  });

  it('should only find pending payments', async () => {
    // Setup
    const now = new Date('2026-02-10T12:00:00.000Z');
    vi.setSystemTime(now);

    vi.mocked(db.payment.findMany).mockResolvedValue([]);

    // Execute
    await applyPenalties();

    // Verify - should query for pending status
    expect(db.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'pending',
        }),
      })
    );
  });
});
