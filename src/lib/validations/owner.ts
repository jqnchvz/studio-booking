import { z } from 'zod';

// ─── Resource ────────────────────────────────────────────────────────────────

const RESOURCE_TYPES = ['room', 'court', 'equipment', 'other'] as const;
const resourceTypeSchema = z
  .string()
  .refine((val): val is (typeof RESOURCE_TYPES)[number] => RESOURCE_TYPES.includes(val as never), {
    message: 'El tipo debe ser room, court, equipment u other',
  });

export const createResourceSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  type: resourceTypeSchema,
  description: z.string().trim().optional(),
  capacity: z.number().int().positive().optional().nullable(),
  dropInEnabled: z.boolean().optional(),
  dropInPricePerHour: z.number().int().positive().optional().nullable(),
});

export const updateResourceSchema = createResourceSchema.superRefine((data, ctx) => {
  if (data.dropInEnabled && (!data.dropInPricePerHour || data.dropInPricePerHour <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El precio por hora es requerido cuando drop-in está habilitado',
      path: ['dropInPricePerHour'],
    });
  }
});

export const toggleActiveSchema = z.object({
  isActive: z.boolean({ error: 'El campo isActive debe ser un booleano' }),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ToggleActiveInput = z.infer<typeof toggleActiveSchema>;

// ─── Plan ─────────────────────────────────────────────────────────────────────

const PLAN_INTERVALS = ['monthly', 'yearly'] as const;
const planIntervalSchema = z
  .string()
  .refine((val): val is (typeof PLAN_INTERVALS)[number] => PLAN_INTERVALS.includes(val as never), {
    message: 'El intervalo debe ser monthly o yearly',
  });

export const createPlanSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: z.string().trim().min(1, 'La descripción es requerida'),
  price: z.number().positive('El precio debe ser un número positivo'),
  interval: planIntervalSchema,
  features: z.array(z.string()).optional(),
});

export const updatePlanSchema = createPlanSchema;

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
