'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfileEditFormProps {
  currentUser: User;
  onSuccess: (updatedUser: User) => void;
}

export default function ProfileEditForm({
  currentUser,
  onSuccess,
}: ProfileEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailChanged, setEmailChanged] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: currentUser.name,
      email: currentUser.email,
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setEmailChanged(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || result.error || 'Error al actualizar el perfil');
        setIsSubmitting(false);
        return;
      }

      setSuccess(result.message);
      setEmailChanged(result.emailChanged || false);

      setTimeout(() => {
        onSuccess(result.user);
      }, 1500);
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Ocurrió un error inesperado. Intenta nuevamente.');
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
          <p className="text-sm font-medium text-success">{success}</p>
          {emailChanged && (
            <p className="mt-1 text-sm text-success/80">
              Revisa tu nuevo email para verificar la dirección.
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Cambiar tu email requiere re-verificación
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
