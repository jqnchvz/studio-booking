'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

function PendingVerificationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground">
          We've sent a verification link to your email
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify your email address</CardTitle>
          <CardDescription>
            {email ? (
              <>
                We sent a verification link to <strong>{email}</strong>
              </>
            ) : (
              'We sent a verification link to your email address'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Click the link in the email to complete your registration. The link
              will expire in 24 hours.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>Didn't receive the email? Check your spam folder.</p>
            <p>
              If you still don't see it,{' '}
              <Button
                variant="link"
                className="h-auto p-0 font-medium text-primary hover:underline underline-offset-4"
                disabled
              >
                resend verification email
              </Button>
              {' '}(coming soon)
            </p>
          </div>

          <div className="pt-2">
            <p className="text-center text-sm text-muted-foreground">
              Already verified?{' '}
              <a
                href="/login"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <a
          href="/register"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Back to registration
        </a>
      </p>
    </div>
  );
}

export default function PendingVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <PendingVerificationContent />
    </Suspense>
  );
}
