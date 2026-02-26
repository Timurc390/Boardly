import { renderHook } from '@testing-library/react';
import { useProfilePrivacy } from './useProfilePrivacy';

describe('useProfilePrivacy', () => {
  it('returns localized privacy content', () => {
    const { result: ukResult } = renderHook(() => useProfilePrivacy('uk'));
    const { result: enResult } = renderHook(() => useProfilePrivacy('en'));

    expect(ukResult.current.paragraphs.length).toBeGreaterThan(0);
    expect(enResult.current.paragraphs.length).toBeGreaterThan(0);
    expect(typeof ukResult.current.summaryTitle).toBe('string');
    expect(typeof enResult.current.summaryTitle).toBe('string');
  });
});
