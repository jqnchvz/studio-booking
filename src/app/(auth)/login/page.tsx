import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginForm } from '@/components/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Don&apos;t have an account?{' '}
        <a
          href="/register"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Sign up
        </a>
      </p>
    </div>
  );
}
