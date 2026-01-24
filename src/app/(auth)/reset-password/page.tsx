'use client';

import { Suspense } from 'react';
import ResetPasswordForm from '@/components/features/auth/ResetPasswordForm';

/**
 * Password Reset Page
 * Allows users to set a new password using a reset token
 *
 * URL: /reset-password?token=xxx
 */
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
