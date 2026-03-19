import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring: sample 10% of transactions
  tracesSampleRate: 0.1,

  // Replay configuration for debugging user sessions
  replaysSessionSampleRate: 0,    // Don't record normal sessions
  replaysOnErrorSampleRate: 1.0,  // Always record sessions with errors

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    'ResizeObserver loop',
    // Network errors users can't control
    'Failed to fetch',
    'NetworkError',
    'Load failed',
  ],
});
