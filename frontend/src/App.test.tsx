import { getPrivacyPolicyContent } from './content/privacyPolicyContent';

describe('privacy policy content', () => {
  test('returns localized content for supported locale', () => {
    const content = getPrivacyPolicyContent('uk');

    expect(content.isTranslated).toBe(true);
    expect(content.sections.length).toBeGreaterThan(0);
    expect(content.navTitle).toBe('Політика конфіденційності');
  });

  test('falls back to english metadata for unsupported locale', () => {
    const content = getPrivacyPolicyContent('it' as any);

    expect(content.navTitle).toBe('Privacy Policy');
    expect(content.effectiveDate).toBe('October 7, 2025');
    expect(content.sections.length).toBeGreaterThan(0);
  });
});
