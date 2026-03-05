'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const ProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  businessType: z.enum(['studio', 'gym', 'clinic', 'other']).nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  timezone: z.string(),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;

interface OwnerProfileFormProps {
  defaultValues: ProfileFormData;
}

const BUSINESS_TYPES = [
  { value: 'studio', label: 'Estudio' },
  { value: 'gym', label: 'Gimnasio' },
  { value: 'clinic', label: 'Clínica' },
  { value: 'other', label: 'Otro' },
] as const;

const TIMEZONES = [
  { value: 'America/Santiago', label: 'Santiago (GMT-3/-4)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-5/-6)' },
] as const;

export function OwnerProfileForm({ defaultValues }: OwnerProfileFormProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProfileFormData) => {
    setStatus('idle');
    try {
      const res = await fetch('/api/owner/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error inesperado');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {status === 'success' && (
        <Alert className="border-success/30 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">Configuración guardada.</AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del negocio *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessType">Tipo de negocio</Label>
        <select
          id="businessType"
          value={watch('businessType') ?? ''}
          onChange={(e) =>
            setValue(
              'businessType',
              (e.target.value || null) as ProfileFormData['businessType']
            )
          }
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Selecciona tipo...</option>
          {BUSINESS_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" type="tel" {...register('phone')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" {...register('address')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Zona horaria</Label>
        <select
          id="timezone"
          value={watch('timezone')}
          onChange={(e) => setValue('timezone', e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
