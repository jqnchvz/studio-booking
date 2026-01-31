import { z } from 'zod';

/**
 * Validation schema for creating subscription preference
 */
export const createSubscriptionPreferenceSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
});

/**
 * Type inference for create subscription preference request
 */
export type CreateSubscriptionPreferenceInput = z.infer<
  typeof createSubscriptionPreferenceSchema
>;

/**
 * Validation schema for reactivating subscription
 */
export const reactivateSubscriptionSchema = z.object({
  newPlanId: z.string().uuid().optional(),
});

/**
 * Type inference for reactivate subscription request
 */
export type ReactivateSubscriptionInput = z.infer<typeof reactivateSubscriptionSchema>;
