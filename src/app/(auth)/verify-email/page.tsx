'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type VerificationState = 'loading' | 'success' | 'error' | 'no-token';

interface VerificationResult {
  success: boolean;
  message: string;
  email?: string;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>('loading');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const token = searchParams.get('token');

    // Check if token exists
    if (!token) {
      setState('no-token');
      return;
    }

    // Verify the token
    async function verifyEmail() {
      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token!)}`
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setState('success');
          setResult(data);
        } else {
          setState('error');
          setResult(data);
        }
      } catch (error) {
        setState('error');
        setResult({
          success: false,
          message: 'An unexpected error occurred. Please try again.',
        });
      }
    }

    verifyEmail();
  }, [searchParams]);

  // Auto-redirect countdown on success
  useEffect(() => {
    if (state === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (state === 'success' && countdown === 0) {
      router.push('/login');
    }
  }, [state, countdown, router]);

  // Loading state
  if (state === 'loading') {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Verifying your email</h1>
          <p className="text-muted-foreground">Please wait while we verify your email address...</p>
        </div>
      </div>
    );
  }

  // No token state
  if (state === 'no-token') {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Missing verification token</h1>
          <p className="text-muted-foreground">
            The verification link appears to be incomplete
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              Please check your email and click the complete verification link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/register')}
              className="w-full"
            >
              Back to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Email verified!</h1>
          <p className="text-muted-foreground">
            Your email has been successfully verified
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verification Complete</CardTitle>
            {result?.email && (
              <CardDescription>
                <strong>{result.email}</strong> has been verified
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              <AlertDescription>
                {result?.message || 'You can now sign in to your account'}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-destructive/10 p-3">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Verification failed</h1>
        <p className="text-muted-foreground">
          We couldn't verify your email address
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Error</CardTitle>
          <CardDescription>
            Please try again or request a new verification link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {result?.message || 'An error occurred during verification'}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => router.push('/register')}
              className="w-full"
            >
              Back to Registration
            </Button>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
