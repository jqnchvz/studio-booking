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
