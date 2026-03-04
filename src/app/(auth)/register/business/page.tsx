import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { BusinessRegistrationForm } from '@/components/features/auth/BusinessRegistrationForm';

export const metadata: Metadata = {
  title: 'Registra tu negocio - Reservapp',
  description: 'Crea tu cuenta de negocio y empieza a gestionar reservas.',
};

export default function BusinessRegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Registra tu negocio</h1>
        <p className="text-muted-foreground text-sm">
          Crea tu cuenta y empieza a gestionar reservas en minutos
        </p>
      </div>

      {/* Suspense required by useSearchParams inside BusinessRegistrationForm */}
      <Suspense>
        <BusinessRegistrationForm />
      </Suspense>

      <div className="text-center space-y-2 text-sm text-muted-foreground">
        <p>
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
        <p>
          ¿Eres cliente?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
