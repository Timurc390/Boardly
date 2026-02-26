export type FileValidationError = 'invalid_type' | 'too_large';

export const validateImageFile = (
  file: File,
  options?: { maxMb?: number }
): { valid: true } | { valid: false; error: FileValidationError; maxMb: number } => {
  const maxMb = options?.maxMb ?? 5;

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'invalid_type', maxMb };
  }

  if (file.size > maxMb * 1024 * 1024) {
    return { valid: false, error: 'too_large', maxMb };
  }

  return { valid: true };
};
