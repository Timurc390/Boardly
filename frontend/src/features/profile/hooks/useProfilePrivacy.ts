import { useMemo } from 'react';
import { getProfilePrivacyContent } from '../../../content/profilePrivacyContent';
import { type Locale } from '../../../i18n/translations';

export const useProfilePrivacy = (locale: Locale) => {
  return useMemo(() => getProfilePrivacyContent(locale), [locale]);
};
