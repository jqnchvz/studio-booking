import { z } from 'zod';

export const promoteUserSchema = z.object({
  isAdmin: z.boolean(),
});

export type PromoteUserInput = z.infer<typeof promoteUserSchema>;

/**
 * Manual subscription activation
 */
export const activateSubscriptionSchema = z.object({
  action: z.literal('activate'),
  planId: z.string().min(1), // Plan existence validated in API via database lookup
  startDate: z.string().datetime(), // ISO 8601
});

/**
 * Manual subscription suspension
 */
export const suspendSubscriptionSchema = z.object({
  action: z.literal('suspend'),
  reason: z.string().min(10).max(500),
  endDate: z.string().datetime().optional(), // If omitted, suspend immediately
});

/**
 * Union type for subscription management
 */
export const manageSubscriptionSchema = z.discriminatedUnion('action', [
  activateSubscriptionSchema,
  suspendSubscriptionSchema,
]);

export type ActivateSubscriptionInput = z.infer<typeof activateSubscriptionSchema>;
export type SuspendSubscriptionInput = z.infer<typeof suspendSubscriptionSchema>;
export type ManageSubscriptionInput = z.infer<typeof manageSubscriptionSchema>;
