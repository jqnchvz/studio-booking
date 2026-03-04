import { z } from 'zod';

/**
 * Password validation regex:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * User registration validation schema (for API)
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      passwordRegex,
      'La contraseña debe contener mayúscula, minúscula, número y un carácter especial: @ $ ! % * ? &'
    ),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar 50 caracteres')
    .trim(),
});

/**
 * User registration form validation schema (with password confirmation)
 */
export const registerFormSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El correo es requerido')
      .email('Correo electrónico inválido')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        passwordRegex,
        'La contraseña debe contener mayúscula, minúscula, número y un carácter especial: @ $ ! % * ? &'
      ),
    confirmPassword: z.string().min(1, 'Por favor confirma tu contraseña'),
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede superar 50 caracteres')
      .trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * User login validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

/**
 * Password reset validation schema (API)
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token de restablecimiento es requerido'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      passwordRegex,
      'La contraseña debe contener mayúscula, minúscula, número y un carácter especial: @ $ ! % * ? &'
    ),
});

/**
 * Password reset form validation schema (with password confirmation)
 */
export const resetPasswordFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        passwordRegex,
        'La contraseña debe contener mayúscula, minúscula, número y un carácter especial: @ $ ! % * ? &'
      ),
    confirmPassword: z.string().min(1, 'Por favor confirma tu contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * Change password validation schema (API — no confirmPassword)
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      passwordRegex,
      'La contraseña debe contener mayúscula, minúscula, número y un carácter especial: @ $ ! % * ? &'
    ),
});

/**
 * Change password form validation schema (client — includes confirmPassword)
 */
export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        passwordRegex,
        'La contraseña debe contener mayúscula, minúscula, número y un carácter especial: @ $ ! % * ? &'
      ),
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * Profile update validation schema
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar 50 caracteres')
    .trim()
    .optional(),
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido')
    .toLowerCase()
    .trim()
    .optional(),
});

/**
 * Business owner registration schema (for API)
 */
export const businessRegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar 50 caracteres')
    .trim(),
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      passwordRegex,
      'La contraseña debe contener mayúscula, minúscula, número y un carácter especial: @ $ ! % * ? &'
    ),
  businessName: z
    .string()
    .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
    .max(100, 'El nombre del negocio no puede superar 100 caracteres')
    .trim(),
  businessType: z.enum(['studio', 'gym', 'clinic', 'other']),
});

/**
 * Business owner registration form schema (with password confirmation)
 */
export const businessRegisterFormSchema = businessRegisterSchema
  .extend({
    confirmPassword: z.string().min(1, 'Por favor confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * Infer TypeScript types from schemas
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;
export type BusinessRegisterInput = z.infer<typeof businessRegisterSchema>;
export type BusinessRegisterFormInput = z.infer<typeof businessRegisterFormSchema>;
