import * as Sentry from '@sentry/react';

let initialized = false;

const toSampleRate = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return fallback;
  return parsed;
};

export const initSentry = () => {
  if (initialized) return;
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.REACT_APP_SENTRY_ENV || process.env.NODE_ENV,
    tracesSampleRate: toSampleRate(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE, 0),
  });
  initialized = true;
};

export const captureOperationalMessage = (
  message: string,
  level: 'info' | 'warning' | 'error',
  details?: Record<string, unknown>
) => {
  if (!Sentry.getClient()) return;
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (details) {
      Object.entries(details).forEach(([key, value]) => scope.setExtra(key, value));
    }
    Sentry.captureMessage(message);
  });
};

export const captureOperationalError = (error: unknown, details?: Record<string, unknown>) => {
  if (!Sentry.getClient()) return;
  Sentry.withScope((scope) => {
    if (details) {
      Object.entries(details).forEach(([key, value]) => scope.setExtra(key, value));
    }
    Sentry.captureException(error);
  });
};
