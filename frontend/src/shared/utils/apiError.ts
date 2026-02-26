import { isAxiosError } from 'axios';

export const getApiErrorPayload = (error: unknown, fallback: unknown): unknown => {
  if (isAxiosError(error)) {
    return error.response?.data ?? fallback;
  }
  return fallback;
};

export const extractApiErrorDetail = (error: unknown, fallback: string): string => {
  const payload = getApiErrorPayload(error, fallback);

  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  const nonFieldErrors = (payload as { non_field_errors?: unknown }).non_field_errors;
  if (Array.isArray(nonFieldErrors) && typeof nonFieldErrors[0] === 'string') {
    return nonFieldErrors[0];
  }

  const firstKey = Object.keys(payload)[0];
  if (firstKey) {
    const firstValue = (payload as Record<string, unknown>)[firstKey];
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') {
      return firstValue[0];
    }
  }

  return fallback;
};
