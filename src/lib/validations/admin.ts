import { z } from 'zod';

export const promoteUserSchema = z.object({
  isAdmin: z.boolean(),
});

export type PromoteUserInput = z.infer<typeof promoteUserSchema>;
