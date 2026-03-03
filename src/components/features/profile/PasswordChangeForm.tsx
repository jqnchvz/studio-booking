'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordFormSchema,
  type ChangePasswordFormInput,
} from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PasswordChangeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordFormSchema),
  });

  const onSubmit = async (data: ChangePasswordFormInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || result.error || 'Error al cambiar la contraseña');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      reset();
    } catch (err) {
      console.error('Password change error:', err);
      setError('Ocurrió un error inesperado. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-success/10 p-4">
          <p className="text-sm font-medium text-success">
            Contraseña actualizada correctamente.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="currentPassword">Contraseña actual</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register('currentPassword')}
          className={errors.currentPassword ? 'border-destructive' : ''}
        />
        {errors.currentPassword && (
          <p className="mt-1 text-sm text-destructive">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register('newPassword')}
          className={errors.newPassword ? 'border-destructive' : ''}
        />
        {errors.newPassword && (
          <p className="mt-1 text-sm text-destructive">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className={errors.confirmPassword ? 'border-destructive' : ''}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Actualizando...' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
}
