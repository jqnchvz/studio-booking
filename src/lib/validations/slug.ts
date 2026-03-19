import { z } from 'zod';
import { isReservedSubdomain } from '@/lib/utils/domain';

/**
 * Zod schema for subdomain slug validation.
 * DNS label rules: 3-63 chars, lowercase alphanumeric + hyphens,
 * cannot start or end with a hyphen.
 */
export const SlugSchema = z.object({
  slug: z
    .string()
    .min(3, 'El subdominio debe tener al menos 3 caracteres')
    .max(63, 'El subdominio no puede tener más de 63 caracteres')
    .regex(
      /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/,
      'Solo letras minúsculas, números y guiones. No puede empezar ni terminar con guión.',
    )
    .refine((slug) => !isReservedSubdomain(slug), {
      message: 'Este subdominio está reservado',
    }),
});
