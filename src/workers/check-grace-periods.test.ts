import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkGracePeriods } from './check-grace-periods';

// Mock the database
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    subscription: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

describe('checkGracePeriods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-04T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should suspend subscriptions with expired grace periods', async () => {
    const expiredSub = {
      id: 'sub-1',
      userId: 'user-1',
      status: 'past_due',
      gracePeriodEnd: new Date('2026-02-03T12:00:00Z'), // Yesterday
      user: { email: 'expired@example.com' },
    };

    mockFindMany.mockResolvedValueOnce([expiredSub]);
    mockUpdate.mockResolvedValueOnce({});

    const count = await checkGracePeriods();

    expect(count).toBe(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        status: 'suspended',
        gracePeriodEnd: null,
      },
    });
  });

  it('should suspend multiple expired subscriptions', async () => {
    const subs = [
      {
        id: 'sub-1',
        userId: 'user-1',
        status: 'past_due',
        gracePeriodEnd: new Date('2026-02-02T00:00:00Z'),
        user: { email: 'user1@example.com' },
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        status: 'past_due',
        gracePeriodEnd: new Date('2026-02-01T00:00:00Z'),
        user: { email: 'user2@example.com' },
      },
    ];

    mockFindMany.mockResolvedValueOnce(subs);
    mockUpdate.mockResolvedValue({});

    const count = await checkGracePeriods();

    expect(count).toBe(2);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('should not suspend subscriptions with future gracePeriodEnd', async () => {
    // The query uses lte: now, so future grace periods won't be returned
    mockFindMany.mockResolvedValueOnce([]);

    const count = await checkGracePeriods();

    expect(count).toBe(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should query for past_due subscriptions with expired grace periods', async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await checkGracePeriods();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        status: 'past_due',
        gracePeriodEnd: {
          lte: new Date('2026-02-04T12:00:00Z'),
        },
      },
      include: {
        user: { select: { email: true } },
      },
    });
  });

  it('should handle no matching subscriptions gracefully', async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const count = await checkGracePeriods();

    expect(count).toBe(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should continue processing other subscriptions if one fails', async () => {
    const subs = [
      {
        id: 'sub-fail',
        userId: 'user-1',
        status: 'past_due',
        gracePeriodEnd: new Date('2026-02-03T00:00:00Z'),
        user: { email: 'fail@example.com' },
      },
      {
        id: 'sub-ok',
        userId: 'user-2',
        status: 'past_due',
        gracePeriodEnd: new Date('2026-02-03T00:00:00Z'),
        user: { email: 'ok@example.com' },
      },
    ];

    mockFindMany.mockResolvedValueOnce(subs);
    mockUpdate
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce({});

    const count = await checkGracePeriods();

    // Only 1 succeeded, 1 failed
    expect(count).toBe(1);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });
});
