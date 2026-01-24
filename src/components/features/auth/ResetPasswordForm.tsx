'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  resetPasswordFormSchema,
  type ResetPasswordFormInput,
} from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Reset Password Form Component
 * Handles password reset with token from URL
 */
export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  // Check if token exists
  if (!token) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <p className="text-sm text-red-800">
          Invalid reset link. No token provided.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || result.error || 'Failed to reset password');
        setIsSubmitting(false);
        return;
      }

      // Success!
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Show success state
  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-green-900">
            Password Reset Successful!
          </h3>
          <p className="mb-4 text-sm text-green-700">
            Your password has been reset. Redirecting to login...
          </p>
          <Link
            href="/login"
            className="text-sm font-medium text-green-600 hover:text-green-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* New Password */}
      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative mt-1">
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('newPassword')}
            className={errors.newPassword ? 'border-red-500' : ''}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.newPassword.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 8 characters with uppercase, lowercase, number, and
          special character
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative mt-1">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? (
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Resetting Password...
          </span>
        ) : (
          'Reset Password'
        )}
      </Button>

      {/* Back to Login Link */}
      <div className="text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Back to Login
        </Link>
      </div>
    </form>
  );
}
