import { z } from 'zod';

/**
 * Reservation creation validation schema
 * Validates all required fields and enforces business rules for reservation duration and timing
 */
export const createReservationSchema = z
  .object({
    resourceId: z
      .string()
      .min(1, 'El ID del recurso es obligatorio')
      .cuid('ID de recurso inválido'),

    title: z
      .string()
      .min(3, 'El título debe tener al menos 3 caracteres')
      .max(100, 'El título no puede exceder 100 caracteres')
      .trim(),

    description: z
      .string()
      .max(500, 'La descripción no puede exceder 500 caracteres')
      .trim()
      .optional(),

    startTime: z
      .string()
      .datetime('Formato de fecha inválido')
      .or(z.date()),

    endTime: z
      .string()
      .datetime('Formato de fecha inválido')
      .or(z.date()),

    attendees: z
      .number()
      .int('El número de asistentes debe ser un entero')
      .min(1, 'Debe haber al menos 1 asistente')
      .max(100, 'El número máximo de asistentes es 100')
      .default(1),
  })
  .transform((data) => ({
    ...data,
    // Ensure dates are Date objects for consistent handling
    startTime: typeof data.startTime === 'string' ? new Date(data.startTime) : data.startTime,
    endTime: typeof data.endTime === 'string' ? new Date(data.endTime) : data.endTime,
  }))
  .refine((data) => data.endTime > data.startTime, {
    message: 'La hora de finalización debe ser posterior a la hora de inicio',
    path: ['endTime'],
  })
  .refine((data) => data.startTime > new Date(), {
    message: 'La reserva debe ser para una fecha futura',
    path: ['startTime'],
  })
  .refine(
    (data) => {
      // Minimum reservation duration: 30 minutes
      const durationMs = data.endTime.getTime() - data.startTime.getTime();
      const minDurationMs = 30 * 60 * 1000; // 30 minutes
      return durationMs >= minDurationMs;
    },
    {
      message: 'La duración mínima de una reserva es de 30 minutos',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      // Maximum reservation duration: 8 hours
      const durationMs = data.endTime.getTime() - data.startTime.getTime();
      const maxDurationMs = 8 * 60 * 60 * 1000; // 8 hours
      return durationMs <= maxDurationMs;
    },
    {
      message: 'La duración máxima de una reserva es de 8 horas',
      path: ['endTime'],
    }
  );

/**
 * Type inference for create reservation input
 */
export type CreateReservationInput = z.infer<typeof createReservationSchema>;

/**
 * Reservation update (PATCH) validation schema — all fields optional.
 * If both startTime and endTime are provided, enforces ordering and duration rules.
 */
export const updateReservationSchema = z
  .object({
    title: z
      .string()
      .min(3, 'El título debe tener al menos 3 caracteres')
      .max(100, 'El título no puede exceder 100 caracteres')
      .trim()
      .optional(),

    description: z
      .string()
      .max(500, 'La descripción no puede exceder 500 caracteres')
      .trim()
      .optional(),

    startTime: z.string().datetime('Formato de fecha inválido').or(z.date()).optional(),

    endTime: z.string().datetime('Formato de fecha inválido').or(z.date()).optional(),

    attendees: z
      .number()
      .int('El número de asistentes debe ser un entero')
      .min(1, 'Debe haber al menos 1 asistente')
      .max(100, 'El número máximo de asistentes es 100')
      .optional(),
  })
  .transform((data) => ({
    ...data,
    startTime:
      data.startTime !== undefined
        ? typeof data.startTime === 'string'
          ? new Date(data.startTime)
          : data.startTime
        : undefined,
    endTime:
      data.endTime !== undefined
        ? typeof data.endTime === 'string'
          ? new Date(data.endTime)
          : data.endTime
        : undefined,
  }))
  .refine((data) => !(data.startTime && data.endTime) || data.endTime > data.startTime, {
    message: 'La hora de finalización debe ser posterior a la hora de inicio',
    path: ['endTime'],
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      const durationMs = data.endTime.getTime() - data.startTime.getTime();
      return durationMs >= 30 * 60 * 1000;
    },
    { message: 'La duración mínima de una reserva es de 30 minutos', path: ['endTime'] }
  )
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      const durationMs = data.endTime.getTime() - data.startTime.getTime();
      return durationMs <= 8 * 60 * 60 * 1000;
    },
    { message: 'La duración máxima de una reserva es de 8 horas', path: ['endTime'] }
  );

export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
