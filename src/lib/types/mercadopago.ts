import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

/**
 * Recurring billing configuration for subscription PreApprovals.
 * All fields are required by the MercadoPago PreApproval API.
 */
export const PreApprovalAutoRecurringSchema = z.object({
  /** Billing frequency value (e.g. 1 for monthly) */
  frequency: z.number().int().positive(),
  /** Unit of the billing frequency */
  frequency_type: z.enum(['days', 'months']),
  /** Billing amount in the plan currency */
  transaction_amount: z.number().positive(),
  /** ISO 4217 currency code (CLP for Chile) */
  currency_id: z.string().min(1),
});

// ---------------------------------------------------------------------------
// PreApproval (subscription) schemas
// ---------------------------------------------------------------------------

/**
 * Payload for creating a new recurring-payment PreApproval.
 *
 * RES-63 root cause: MercadoPago requires `payer_email` but the SDK type
 * allowed it to be undefined, causing a 400 at runtime.
 * This schema enforces the field at both compile-time and runtime.
 */
export const PreApprovalCreateSchema = z.object({
  /** Human-readable reason shown in MercadoPago checkout */
  reason: z.string().min(1, 'Reason is required'),
  /**
   * Payer e-mail address — REQUIRED by MercadoPago API.
   * Must be a valid e-mail; SDK types incorrectly allow undefined.
   */
  payer_email: z.string().email('Valid payer email is required'),
  /** Recurring-billing configuration */
  auto_recurring: PreApprovalAutoRecurringSchema,
  /** URL MercadoPago redirects to after the checkout flow */
  back_url: z.string().min(1, 'Back URL is required'),
  /** Internal reference linking this preapproval to a user/plan pair */
  external_reference: z.string().min(1, 'External reference is required'),
});

/**
 * Payload for cancelling an active subscription.
 */
export const PreApprovalCancelSchema = z.object({
  status: z.literal('cancelled'),
});

/**
 * Payload for updating only the recurring billing amount.
 * Uses a partial auto_recurring object — only the fields being changed.
 */
export const PreApprovalAmountUpdateSchema = z.object({
  auto_recurring: z.object({
    transaction_amount: z.number().positive('Amount must be a positive number'),
    currency_id: z.string().min(1),
  }),
});

// ---------------------------------------------------------------------------
// Preference (one-time payment) schemas
// ---------------------------------------------------------------------------

/**
 * A single line item in a MercadoPago Preference.
 */
export const PreferenceItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  currency_id: z.string().min(1),
});

/**
 * Payload for creating a one-time payment Preference.
 * Used for overdue payments and any non-recurring charges.
 */
export const PreferenceCreateSchema = z.object({
  items: z.array(PreferenceItemSchema).min(1, 'At least one item is required'),
  external_reference: z.string().min(1, 'External reference is required'),
  back_urls: z.object({
    success: z.string().min(1),
    failure: z.string().min(1),
    pending: z.string().min(1),
  }),
  auto_return: z.enum(['approved', 'all']).optional(),
  notification_url: z.string().min(1).optional(),
});

// ---------------------------------------------------------------------------
// TypeScript types (inferred from schemas)
// ---------------------------------------------------------------------------

export type PreApprovalCreateInput = z.infer<typeof PreApprovalCreateSchema>;
export type PreApprovalCancelInput = z.infer<typeof PreApprovalCancelSchema>;
export type PreApprovalAmountUpdateInput = z.infer<typeof PreApprovalAmountUpdateSchema>;
export type PreferenceCreateInput = z.infer<typeof PreferenceCreateSchema>;
export type PreferenceItemInput = z.infer<typeof PreferenceItemSchema>;

// ---------------------------------------------------------------------------
// Response interfaces
// ---------------------------------------------------------------------------

/**
 * Relevant fields returned by the MercadoPago PreApproval API.
 * The SDK returns a much larger object; we only type what the service uses.
 */
export interface PreApprovalResponse {
  id?: string;
  init_point?: string;
  status?: string;
  reason?: string;
  payer_email?: string;
  external_reference?: string;
}

/**
 * Relevant fields returned by the MercadoPago Preference API.
 */
export interface PreferenceResponse {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
}
