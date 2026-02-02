/**
 * Penalty Fee Calculation Service
 *
 * Calculates late payment penalties with:
 * - 2-day grace period after due date
 * - 5% base penalty rate
 * - +0.5% per additional day late
 * - Maximum penalty capped at 50% of base amount
 */

// ── Configuration Constants ──────────────────────────────────────────

export const GRACE_PERIOD_DAYS = 2;
export const BASE_PENALTY_RATE = 0.05; // 5%
export const DAILY_PENALTY_RATE = 0.005; // 0.5% per day
export const MAX_PENALTY_RATE = 0.50; // 50% cap

// ── Types ────────────────────────────────────────────────────────────

export interface PenaltyInput {
  /** The original amount due (in CLP, integer) */
  baseAmount: number;
  /** The date the payment was due */
  dueDate: Date;
  /** The date the payment was actually made */
  paymentDate: Date;
}

export interface PenaltyResult {
  /** The penalty amount to charge (in CLP, integer) */
  penaltyAmount: number;
  /** The effective penalty rate applied (0 to MAX_PENALTY_RATE) */
  penaltyRate: number;
  /** Number of days late (after grace period) */
  daysLate: number;
  /** Whether the payment was within the grace period */
  withinGracePeriod: boolean;
}

// ── Helper ───────────────────────────────────────────────────────────

/**
 * Calculate the number of full calendar days between two dates.
 * Returns a positive number if paymentDate is after dueDate, 0 otherwise.
 */
export function differenceInCalendarDays(paymentDate: Date, dueDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcPayment = Date.UTC(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
  const utcDue = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return Math.max(0, Math.floor((utcPayment - utcDue) / msPerDay));
}

// ── Core Calculation ─────────────────────────────────────────────────

/**
 * Calculate the penalty fee for a late payment.
 */
export function calculatePenalty(input: PenaltyInput): PenaltyResult {
  const { baseAmount, dueDate, paymentDate } = input;

  const totalDaysLate = differenceInCalendarDays(paymentDate, dueDate);
  const daysLate = Math.max(0, totalDaysLate - GRACE_PERIOD_DAYS);
  const withinGracePeriod = totalDaysLate > 0 && daysLate === 0;

  if (daysLate === 0) {
    return { penaltyAmount: 0, penaltyRate: 0, daysLate: 0, withinGracePeriod };
  }

  const penaltyRate = Math.min(
    BASE_PENALTY_RATE + daysLate * DAILY_PENALTY_RATE,
    MAX_PENALTY_RATE
  );
  const penaltyAmount = Math.round(baseAmount * penaltyRate);

  return { penaltyAmount, penaltyRate, daysLate, withinGracePeriod };
}
