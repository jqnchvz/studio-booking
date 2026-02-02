import { describe, it, expect } from 'vitest';
import {
  calculatePenalty,
  differenceInCalendarDays,
  GRACE_PERIOD_DAYS,
  BASE_PENALTY_RATE,
  DAILY_PENALTY_RATE,
  MAX_PENALTY_RATE,
  PenaltyInput,
} from './penalty.service';

// ── Helper: create dates easily ──────────────────────────────────────

function makeInput(
  baseAmount: number,
  dueDate: string,
  paymentDate: string
): PenaltyInput {
  return {
    baseAmount,
    dueDate: new Date(dueDate),
    paymentDate: new Date(paymentDate),
  };
}

// ── differenceInCalendarDays ─────────────────────────────────────────

describe('differenceInCalendarDays', () => {
  it('should return 0 when dates are the same', () => {
    const date = new Date('2026-02-01');
    expect(differenceInCalendarDays(date, date)).toBe(0);
  });

  it('should return positive days when payment is after due date', () => {
    expect(
      differenceInCalendarDays(new Date('2026-02-05'), new Date('2026-02-01'))
    ).toBe(4);
  });

  it('should return 0 when payment is before due date', () => {
    expect(
      differenceInCalendarDays(new Date('2026-01-30'), new Date('2026-02-01'))
    ).toBe(0);
  });

  it('should handle month boundaries correctly', () => {
    expect(
      differenceInCalendarDays(new Date('2026-03-02'), new Date('2026-02-28'))
    ).toBe(2);
  });

  it('should handle year boundaries correctly', () => {
    expect(
      differenceInCalendarDays(new Date('2027-01-01'), new Date('2026-12-31'))
    ).toBe(1);
  });
});

// ── calculatePenalty ─────────────────────────────────────────────────

describe('calculatePenalty', () => {
  describe('on-time payments (no penalty)', () => {
    it('should return zero penalty when paid on the due date', () => {
      const result = calculatePenalty(makeInput(100000, '2026-02-01', '2026-02-01'));

      expect(result.penaltyAmount).toBe(0);
      expect(result.penaltyRate).toBe(0);
      expect(result.daysLate).toBe(0);
      expect(result.withinGracePeriod).toBe(false);
    });

    it('should return zero penalty when paid before the due date', () => {
      const result = calculatePenalty(makeInput(100000, '2026-02-10', '2026-02-05'));

      expect(result.penaltyAmount).toBe(0);
      expect(result.penaltyRate).toBe(0);
      expect(result.daysLate).toBe(0);
      expect(result.withinGracePeriod).toBe(false);
    });
  });

  describe('grace period', () => {
    it('should return zero penalty when paid 1 day after due date (within grace)', () => {
      const result = calculatePenalty(makeInput(100000, '2026-02-01', '2026-02-02'));

      expect(result.penaltyAmount).toBe(0);
      expect(result.daysLate).toBe(0);
      expect(result.withinGracePeriod).toBe(true);
    });

    it('should return zero penalty when paid exactly on grace period boundary', () => {
      const result = calculatePenalty(
        makeInput(100000, '2026-02-01', '2026-02-03') // 2 days = GRACE_PERIOD_DAYS
      );

      expect(result.penaltyAmount).toBe(0);
      expect(result.daysLate).toBe(0);
      expect(result.withinGracePeriod).toBe(true);
    });

    it('should apply penalty when paid 1 day after grace period', () => {
      const result = calculatePenalty(
        makeInput(100000, '2026-02-01', '2026-02-04') // 3 days total, 1 day late
      );

      expect(result.penaltyAmount).toBeGreaterThan(0);
      expect(result.daysLate).toBe(1);
      expect(result.withinGracePeriod).toBe(false);
    });
  });

  describe('penalty calculation', () => {
    it('should apply base rate + daily rate for 1 day late', () => {
      // 1 day late: rate = 0.05 + (1 * 0.005) = 0.055
      const result = calculatePenalty(makeInput(100000, '2026-02-01', '2026-02-04'));

      expect(result.daysLate).toBe(1);
      expect(result.penaltyRate).toBeCloseTo(BASE_PENALTY_RATE + DAILY_PENALTY_RATE);
      expect(result.penaltyAmount).toBe(Math.round(100000 * 0.055));
    });

    it('should apply base rate + daily rate for 5 days late', () => {
      // 5 days late: rate = 0.05 + (5 * 0.005) = 0.075
      const result = calculatePenalty(makeInput(100000, '2026-02-01', '2026-02-08'));

      expect(result.daysLate).toBe(5);
      expect(result.penaltyRate).toBeCloseTo(0.075);
      expect(result.penaltyAmount).toBe(7500);
    });

    it('should apply base rate + daily rate for 10 days late', () => {
      // 10 days late: rate = 0.05 + (10 * 0.005) = 0.10
      const result = calculatePenalty(makeInput(50000, '2026-02-01', '2026-02-13'));

      expect(result.daysLate).toBe(10);
      expect(result.penaltyRate).toBeCloseTo(0.10);
      expect(result.penaltyAmount).toBe(5000);
    });

    it('should round penalty amount to nearest integer (CLP)', () => {
      // 1 day late: rate = 0.055, amount = 33333 * 0.055 = 1833.315 → 1833
      const result = calculatePenalty(makeInput(33333, '2026-02-01', '2026-02-04'));

      expect(result.penaltyAmount).toBe(Math.round(33333 * 0.055));
      expect(Number.isInteger(result.penaltyAmount)).toBe(true);
    });
  });

  describe('penalty cap', () => {
    it('should cap penalty rate at MAX_PENALTY_RATE (50%)', () => {
      // 100 days late: rate = 0.05 + (100 * 0.005) = 0.55 → capped at 0.50
      const result = calculatePenalty(makeInput(100000, '2026-01-01', '2026-04-14'));

      expect(result.penaltyRate).toBe(MAX_PENALTY_RATE);
      expect(result.penaltyAmount).toBe(50000);
    });

    it('should cap exactly at the threshold (90 days late = 0.50)', () => {
      // 90 days late: rate = 0.05 + (90 * 0.005) = 0.50 — exactly at cap
      const result = calculatePenalty(makeInput(100000, '2026-01-01', '2026-04-04'));

      expect(result.penaltyRate).toBe(MAX_PENALTY_RATE);
      expect(result.penaltyAmount).toBe(50000);
    });

    it('should not cap when just below threshold', () => {
      // 89 days late (91 total - 2 grace): rate = 0.05 + (89 * 0.005) = 0.495
      const result = calculatePenalty(makeInput(100000, '2026-01-01', '2026-04-02'));

      expect(result.penaltyRate).toBeCloseTo(0.495);
      expect(result.penaltyRate).toBeLessThan(MAX_PENALTY_RATE);
      expect(result.penaltyAmount).toBe(49500);
    });
  });

  describe('edge cases', () => {
    it('should handle zero base amount', () => {
      const result = calculatePenalty(makeInput(0, '2026-02-01', '2026-02-10'));

      expect(result.penaltyAmount).toBe(0);
      expect(result.daysLate).toBe(7);
    });

    it('should handle large base amounts', () => {
      // 5 days late: rate = 0.075, amount = 10_000_000 * 0.075 = 750_000
      const result = calculatePenalty(makeInput(10_000_000, '2026-02-01', '2026-02-08'));

      expect(result.penaltyAmount).toBe(750_000);
    });
  });

  describe('constants validation', () => {
    it('should have correct grace period', () => {
      expect(GRACE_PERIOD_DAYS).toBe(2);
    });

    it('should have correct base penalty rate', () => {
      expect(BASE_PENALTY_RATE).toBe(0.05);
    });

    it('should have correct daily penalty rate', () => {
      expect(DAILY_PENALTY_RATE).toBe(0.005);
    });

    it('should have correct max penalty rate', () => {
      expect(MAX_PENALTY_RATE).toBe(0.50);
    });
  });
});
