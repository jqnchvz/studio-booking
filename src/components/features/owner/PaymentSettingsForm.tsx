'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Wifi, KeyRound, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const PaymentSchema = z.object({
  accessToken: z.string().min(1, 'El Access Token es requerido'),
  publicKey: z.string().min(1, 'La Public Key es requerida'),
  webhookSecret: z.string().optional(),
});

type PaymentFormData = z.infer<typeof PaymentSchema>;

interface PaymentSettingsFormProps {
  configured: boolean;
  maskedAccessToken?: string;
  maskedPublicKey?: string;
  webhookConfigured?: boolean;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export function PaymentSettingsForm({
  configured,
  maskedAccessToken,
  maskedPublicKey,
  webhookConfigured,
}: PaymentSettingsFormProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentSchema),
  });

  const handleTest = async () => {
    const accessToken = getValues('accessToken');
    if (!accessToken) {
      setTestStatus('error');
      setTestMessage('Ingresa un Access Token para probar la conexión.');
      return;
    }

    setTestStatus('loading');
    setTestMessage('');

    try {
      const res = await fetch('/api/owner/settings/payment/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json() as { valid?: boolean; accountEmail?: string; error?: string };

      if (data.valid) {
        setTestStatus('success');
        setTestMessage(
          data.accountEmail
            ? `Conexión exitosa. Cuenta: ${data.accountEmail}`
            : 'Conexión exitosa con MercadoPago.'
        );
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Credenciales inválidas.');
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Error al conectar con MercadoPago.');
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    setSaveStatus('idle');

    try {
      const res = await fetch('/api/owner/settings/payment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error || 'Error al guardar');
      }

      setSaveStatus('success');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error inesperado');
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      {/* Current status */}
      {configured && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">Credenciales configuradas</span>
            <Badge variant="secondary" className="ml-auto text-xs">Activo</Badge>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <KeyRound className="h-3 w-3" />
              <span className="font-mono text-xs">{maskedAccessToken}</span>
            </div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-3 w-3" />
              <span className="font-mono text-xs">{maskedPublicKey}</span>
            </div>
            {webhookConfigured && (
              <p className="text-xs">Webhook secret: configurado</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Completa el formulario debajo para actualizar las credenciales.
          </p>
        </div>
      )}

      {!configured && (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            Conecta tu cuenta de MercadoPago para empezar a recibir pagos de tus clientes.{' '}
            <Link
              href="/owner/settings/payment/guide"
              className="underline font-medium hover:text-warning/80"
            >
              Ver guia paso a paso
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection test feedback */}
      {testStatus === 'success' && (
        <Alert className="border-success/30 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">{testMessage}</AlertDescription>
        </Alert>
      )}
      {testStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{testMessage}</AlertDescription>
        </Alert>
      )}

      {/* Save feedback */}
      {saveStatus === 'success' && (
        <Alert className="border-success/30 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Credenciales guardadas correctamente.
          </AlertDescription>
        </Alert>
      )}
      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accessToken">Access Token *</Label>
          <Input
            id="accessToken"
            type="password"
            placeholder="APP_USR-..."
            autoComplete="off"
            {...register('accessToken')}
          />
          {errors.accessToken && (
            <p className="text-sm text-destructive">{errors.accessToken.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="publicKey">Public Key *</Label>
          <Input
            id="publicKey"
            type="password"
            placeholder="APP_USR-..."
            autoComplete="off"
            {...register('publicKey')}
          />
          {errors.publicKey && (
            <p className="text-sm text-destructive">{errors.publicKey.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookSecret">
            Webhook Secret{' '}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="webhookSecret"
            type="password"
            autoComplete="off"
            {...register('webhookSecret')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testStatus === 'loading' || isSubmitting}
          >
            <Wifi className="h-4 w-4 mr-2" />
            {testStatus === 'loading' ? 'Probando...' : 'Probar conexión'}
          </Button>

          <Button type="submit" disabled={isSubmitting || testStatus === 'loading'}>
            {isSubmitting ? 'Guardando...' : configured ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>

        <div className="pt-1">
          <Link
            href="/owner/settings/payment/guide"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            No sabes donde obtener estas credenciales? Ver guia
          </Link>
        </div>
      </form>
    </div>
  );
}
