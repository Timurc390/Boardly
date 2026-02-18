import { type Locale } from '../i18n/translations';
import {
  getPrivacyPolicyContent,
} from './privacyPolicyContent';

export type ProfilePrivacyContent = {
  paragraphs: string[];
  summaryTitle: string;
  translationNotice?: string;
};

export const getProfilePrivacyContent = (locale: Locale): ProfilePrivacyContent => {
  const content = getPrivacyPolicyContent(locale);
  return {
    paragraphs: content.sections.flatMap((section) => section.paragraphs),
    summaryTitle: content.summaryTitle,
    translationNotice: content.translationNotice,
  };
};
