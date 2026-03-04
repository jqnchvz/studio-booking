import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RegistrationForm } from '@/components/features/auth/RegistrationForm';

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
        <p className="text-muted-foreground">
          Ingresa tus datos para empezar
        </p>
      </div>

      <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
        <RegistrationForm />
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        ¿Ya tienes cuenta?{' '}
        <a
          href="/login"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Inicia sesión
        </a>
      </p>
    </div>
  );
}
