export type AuthErrorPayload = {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
};

const firstArrayEntry = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  const first = value[0];
  return typeof first === 'string' ? first : null;
};

export const extractAuthErrorMessage = (
  payload: unknown,
  fallback = 'Помилка авторизації.'
): string => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload !== 'object') return fallback;

  const mapped = payload as AuthErrorPayload;
  if (typeof mapped.detail === 'string' && mapped.detail) {
    return mapped.detail;
  }

  const nonField = firstArrayEntry(mapped.non_field_errors);
  if (nonField) {
    return nonField;
  }

  const firstKey = Object.keys(mapped)[0];
  if (!firstKey) return fallback;

  const firstValue = mapped[firstKey];
  return firstArrayEntry(firstValue) ?? fallback;
};
