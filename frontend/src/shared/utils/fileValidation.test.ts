import { validateImageFile } from './fileValidation';

describe('fileValidation', () => {
  it('accepts valid image file in limit', () => {
    const file = new File(['abc'], 'avatar.png', { type: 'image/png' });
    expect(validateImageFile(file, { maxMb: 1 })).toEqual({ valid: true });
  });

  it('rejects non-image file', () => {
    const file = new File(['abc'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateImageFile(file, { maxMb: 1 })).toEqual({
      valid: false,
      error: 'invalid_type',
      maxMb: 1,
    });
  });

  it('rejects image above max size', () => {
    const big = new File([new Uint8Array(2 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    expect(validateImageFile(big, { maxMb: 1 })).toEqual({
      valid: false,
      error: 'too_large',
      maxMb: 1,
    });
  });
});
