'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { loginSchema, type LoginInput } from '@/lib/validations/auth';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Get redirect URL from query params (e.g., /login?from=/dashboard/bookings)
  const redirectTo = searchParams.get('from') || '/dashboard';

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          rememberMe,
        }),
      });

      // Verify response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response');
      }

      const result = await response.json();

      if (!response.ok) {
        // Handle different error responses
        if (response.status === 429) {
          setError(
            `Demasiados intentos de inicio de sesión. Intenta nuevamente después de ${new Date(result.resetTime).toLocaleTimeString()}.`
          );
        } else if (response.status === 401) {
          setError('Correo o contraseña incorrectos. Intenta nuevamente.');
        } else if (response.status === 403) {
          setError(
            result.message ||
              'Verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
          );
        } else if (response.status === 400 && result.details) {
          setError(result.details[0]?.message || 'Datos inválidos.');
        } else {
          setError(result.message || 'Error al iniciar sesión. Intenta nuevamente.');
        }
        return;
      }

      // Success - redirect based on user role
      const destination = result.user?.role === 'admin'
        ? '/admin'
        : result.user?.role === 'owner'
          ? '/owner'
          : redirectTo;

      router.push(destination);
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError('Error inesperado. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remember Me and Forgot Password Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={isLoading}
            />
            <label
              htmlFor="remember-me"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Recordarme
            </label>
          </div>

          <a
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline underline-offset-4"
            tabIndex={isLoading ? -1 : 0}
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </Button>
      </form>
    </Form>
  );
}
