import { type Locale } from '../i18n/translations';

export type PrivacyPolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type PrivacyPolicyLocaleContent = {
  navTitle: string;
  navAriaLabel: string;
  effectiveDateLabel: string;
  effectiveDate: string;
  summaryTitle: string;
  additionalPoliciesLead: string;
  additionalPolicies: string[];
  sections: PrivacyPolicySection[];
  isTranslated: boolean;
  translationNotice?: string;
};

const EN_SECTIONS: PrivacyPolicySection[] = [
  {
    id: 'overview',
    title: 'Privacy policy overview',
    paragraphs: [
      'Your privacy matters to us. This privacy policy explains how Boardly, and our corporate affiliates collect, use, share, and protect your information when you use our products, services, websites, or otherwise interact with us. We offer a wide range of products, including our cloud and software products. We refer to all of these products, together with our other services and websites, as "Services" in this privacy policy.',
      'This privacy policy also explains your choices surrounding how we use information about you, which includes how you can object to certain uses of information about you and how you can access and update certain information about you. If you do not agree with this privacy policy, do not access or use our Services or interact with any other aspect of our business.',
      'For individuals in the European Economic Area, United Kingdom, or the United States: please refer to the appropriate "Regional disclosures" for additional details that may be relevant to you.',
      'This privacy policy is intended to help you understand what information we collect, how we use and disclose it, how we store and secure it, and what rights and controls are available to you.',
    ],
  },
  {
    id: 'collect',
    title: 'Information we collect',
    paragraphs: [
      'We collect information about you when you provide it to us, when you use our Services, and from other sources. This includes account details (for example name, email, and profile preferences), content you provide through our products and websites, support communications, and payment details for paid plans.',
      'We may also receive information when you connect third-party services, such as signing in with Google credentials. The information we receive depends on the permissions and privacy settings of those external services.',
    ],
  },
  {
    id: 'use',
    title: 'How we use information',
    paragraphs: [
      'How we use information depends on which Services you use, how you use them, and any preferences you communicate to us. We use information to provide and personalize Services, develop and improve products, communicate with you, provide customer support, maintain safety and security, and comply with legal obligations.',
    ],
  },
  {
    id: 'disclose',
    title: 'How we disclose information',
    paragraphs: [
      'We disclose information as described in this policy, including to service providers, trusted partners, providers of linked third-party tools, and affiliated companies. We may also disclose information when required by law, to enforce our terms and policies, or with your consent.',
    ],
  },
  {
    id: 'store',
    title: 'How we store and secure information',
    paragraphs: [
      'We use technical and organizational safeguards designed to protect personal information. While no security system is perfect, we continuously work to protect data against unauthorized access, alteration, disclosure, or destruction.',
    ],
  },
  {
    id: 'control',
    title: 'How to access and control your information',
    paragraphs: [
      'Where applicable under local law, you may have rights to request access to your information, correct or delete personal information, restrict or object to certain processing, and receive information in a portable format. You can also update many profile and notification settings directly in your account.',
    ],
  },
  {
    id: 'retention',
    title: 'How long we keep information',
    paragraphs: [
      'We retain personal information for as long as needed to provide Services, satisfy legal requirements, resolve disputes, and enforce our agreements. Retention periods vary depending on the type of information and the purpose of processing.',
    ],
  },
  {
    id: 'regional',
    title: 'Regional disclosures',
    paragraphs: [
      'Additional disclosures may apply based on your location, including specific information for individuals in the European Economic Area, United Kingdom, and United States under applicable privacy laws.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to our privacy policy',
    paragraphs: [
      'We may update this privacy policy from time to time. When we make material changes, we will update the effective date and provide notice as required by applicable law.',
    ],
  },
  {
    id: 'children',
    title: 'Our policy towards children',
    paragraphs: [
      'Our Services are not directed to children under the age defined by applicable law. We do not knowingly collect personal information from children without appropriate authorization.',
    ],
  },
  {
    id: 'contact',
    title: 'How to contact us',
    paragraphs: [
      'If you have questions about this policy, concerns about data handling, or requests related to your personal information rights, contact our support team through official Boardly channels.',
    ],
  },
];

const UK_SECTIONS: PrivacyPolicySection[] = [
  {
    id: 'overview',
    title: 'Огляд політики конфіденційності',
    paragraphs: [
      'Ваша приватність важлива для нас. Ця політика конфіденційності пояснює, як Boardly та наші корпоративні афілійовані компанії збирають, використовують, передають і захищають вашу інформацію, коли ви користуєтеся нашими продуктами, сервісами, вебсайтами або іншим чином взаємодієте з нами. Ми пропонуємо широкий спектр продуктів, включно з хмарними та програмними рішеннями. У цій політиці всі ці продукти, а також інші сервіси та вебсайти, ми називаємо «Сервісами».',
      'Ця політика також пояснює ваші можливості контролю над тим, як ми використовуємо інформацію про вас, зокрема як ви можете заперечити проти окремих способів використання даних, а також як отримати доступ до певної інформації про вас та оновити її. Якщо ви не погоджуєтеся з цією політикою, не використовуйте наші Сервіси та не взаємодійте з іншими аспектами нашої діяльності.',
      'Для осіб із Європейської економічної зони, Великої Британії або США можуть діяти додаткові правила. Деталі дивіться в розділі «Регіональні розкриття».',
      'Мета цієї політики - надати зрозуміле пояснення того, яку інформацію ми збираємо, як її використовуємо і розкриваємо, як зберігаємо та захищаємо, а також які права і механізми контролю вам доступні.',
    ],
  },
  {
    id: 'collect',
    title: 'Яку інформацію ми збираємо',
    paragraphs: [
      'Ми збираємо інформацію, яку ви надаєте безпосередньо, яку отримуємо під час використання вами Сервісів, а також з інших джерел. Це може включати дані облікового запису (наприклад, імʼя, email, налаштування профілю), контент, який ви створюєте в продуктах і на вебсайтах, звернення в підтримку та платіжні дані для платних тарифів.',
      'Ми також можемо отримувати дані, коли ви підключаєте сторонні сервіси, наприклад вхід через Google. Обсяг даних залежить від наданих дозволів і налаштувань приватності у відповідному сторонньому сервісі.',
    ],
  },
  {
    id: 'use',
    title: 'Як ми використовуємо інформацію',
    paragraphs: [
      'Спосіб використання інформації залежить від того, якими Сервісами ви користуєтесь, як саме ви їх використовуєте і які налаштування обираєте. Ми використовуємо інформацію для надання і персоналізації Сервісів, розвитку продуктів, комунікації з вами, підтримки користувачів, забезпечення безпеки та виконання юридичних обовʼязків.',
    ],
  },
  {
    id: 'disclose',
    title: 'Як ми розкриваємо інформацію',
    paragraphs: [
      'Ми розкриваємо інформацію у випадках, описаних у цій політиці, зокрема постачальникам послуг, перевіреним партнерам, постачальникам підключених сторонніх інструментів та афілійованим компаніям. Також розкриття може відбуватися, якщо цього вимагає закон, для захисту наших правил і прав або за вашою згодою.',
    ],
  },
  {
    id: 'store',
    title: 'Як ми зберігаємо і захищаємо інформацію',
    paragraphs: [
      'Ми застосовуємо технічні та організаційні заходи для захисту персональної інформації. Жодна система безпеки не є ідеальною, однак ми постійно працюємо над запобіганням несанкціонованому доступу, зміні, розкриттю або знищенню даних.',
    ],
  },
  {
    id: 'control',
    title: 'Як отримати доступ і керувати своєю інформацією',
    paragraphs: [
      'Якщо це передбачено місцевим законодавством, ви можете мати право запитувати доступ до своїх даних, виправлення або видалення інформації, обмеження чи заперечення проти певної обробки, а також отримання даних у переносному форматі. Значну частину налаштувань профілю та сповіщень можна змінити безпосередньо в обліковому записі.',
    ],
  },
  {
    id: 'retention',
    title: 'Як довго ми зберігаємо інформацію',
    paragraphs: [
      'Ми зберігаємо персональну інформацію стільки, скільки потрібно для надання Сервісів, дотримання юридичних вимог, вирішення спорів і забезпечення виконання наших угод. Строк зберігання залежить від типу інформації та мети її обробки.',
    ],
  },
  {
    id: 'regional',
    title: 'Регіональні розкриття',
    paragraphs: [
      'Залежно від вашого місця проживання можуть діяти додаткові розкриття, зокрема для осіб з Європейської економічної зони, Великої Британії та США відповідно до застосовних законів про приватність.',
    ],
  },
  {
    id: 'changes',
    title: 'Зміни до політики конфіденційності',
    paragraphs: [
      'Ми можемо періодично оновлювати цю політику. У разі суттєвих змін ми оновимо дату набуття чинності та надамо повідомлення, якщо цього вимагає законодавство.',
    ],
  },
  {
    id: 'children',
    title: 'Наша політика щодо дітей',
    paragraphs: [
      'Наші Сервіси не призначені для дітей молодше віку, визначеного застосовним законодавством. Ми свідомо не збираємо персональну інформацію дітей без належного дозволу.',
    ],
  },
  {
    id: 'contact',
    title: 'Як з нами звʼязатися',
    paragraphs: [
      'Якщо у вас є питання щодо цієї політики, зауваження про обробку даних або запити щодо прав на персональну інформацію, зверніться до служби підтримки через офіційні канали Boardly.',
    ],
  },
];

const EN_ADDITIONAL_POLICIES = [
  'Cookies & Tracking Notice',
  'Careers Privacy Notice',
  'Marketplace Privacy Notice',
  'Demographic Survey Privacy Notice',
];

const SECTION_TITLE_TRANSLATIONS: Record<string, Record<string, string>> = {
  pl: {
    overview: 'Przegląd polityki prywatności',
    collect: 'Informacje, które zbieramy',
    use: 'Jak wykorzystujemy informacje',
    disclose: 'Jak ujawniamy informacje',
    store: 'Jak przechowujemy i zabezpieczamy informacje',
    control: 'Jak uzyskać dostęp i kontrolować swoje informacje',
    retention: 'Jak długo przechowujemy informacje',
    regional: 'Ujawnienia regionalne',
    changes: 'Zmiany w polityce prywatności',
    children: 'Nasza polityka wobec dzieci',
    contact: 'Jak się z nami skontaktować',
  },
  de: {
    overview: 'Überblick über die Datenschutzerklärung',
    collect: 'Welche Informationen wir erfassen',
    use: 'Wie wir Informationen verwenden',
    disclose: 'Wie wir Informationen offenlegen',
    store: 'Wie wir Informationen speichern und schützen',
    control: 'Wie Sie auf Ihre Informationen zugreifen und sie kontrollieren',
    retention: 'Wie lange wir Informationen aufbewahren',
    regional: 'Regionale Hinweise',
    changes: 'Änderungen unserer Datenschutzerklärung',
    children: 'Unsere Richtlinie zum Schutz von Kindern',
    contact: 'Wie Sie uns kontaktieren können',
  },
  fr: {
    overview: 'Aperçu de la politique de confidentialité',
    collect: 'Informations que nous collectons',
    use: 'Comment nous utilisons les informations',
    disclose: 'Comment nous divulguons les informations',
    store: 'Comment nous stockons et sécurisons les informations',
    control: 'Comment accéder à vos informations et les contrôler',
    retention: 'Durée de conservation des informations',
    regional: 'Divulgations régionales',
    changes: 'Modifications de notre politique de confidentialité',
    children: 'Notre politique concernant les enfants',
    contact: 'Comment nous contacter',
  },
  es: {
    overview: 'Resumen de la política de privacidad',
    collect: 'Información que recopilamos',
    use: 'Cómo usamos la información',
    disclose: 'Cómo divulgamos la información',
    store: 'Cómo almacenamos y protegemos la información',
    control: 'Cómo acceder y controlar tu información',
    retention: 'Cuánto tiempo conservamos la información',
    regional: 'Divulgaciones regionales',
    changes: 'Cambios en nuestra política de privacidad',
    children: 'Nuestra política sobre menores',
    contact: 'Cómo contactarnos',
  },
};

const BASE_LOCALE_META: Record<
  Locale,
  Omit<PrivacyPolicyLocaleContent, 'sections' | 'additionalPolicies'>
> = {
  uk: {
    navTitle: 'Політика конфіденційності',
    navAriaLabel: 'Розділи політики конфіденційності',
    effectiveDateLabel: 'Набуває чинності з:',
    effectiveDate: '7 жовтня 2025',
    summaryTitle: 'Ця політика конфіденційності допоможе вам зрозуміти:',
    additionalPoliciesLead:
      'Ми також маємо додаткові політики для окремих аудиторій і сценаріїв використання. Зокрема:',
    isTranslated: true,
  },
  en: {
    navTitle: 'Privacy Policy',
    navAriaLabel: 'Privacy policy sections',
    effectiveDateLabel: 'Effective starting:',
    effectiveDate: 'October 7, 2025',
    summaryTitle: 'This privacy policy is intended to help you understand:',
    additionalPoliciesLead:
      'We offer additional policies tailored for specific audiences and use cases. These include:',
    isTranslated: true,
  },
  pl: {
    navTitle: 'Polityka prywatności',
    navAriaLabel: 'Sekcje polityki prywatności',
    effectiveDateLabel: 'Obowiązuje od:',
    effectiveDate: 'October 7, 2025',
    summaryTitle: 'Niniejsza polityka prywatności ma pomóc Ci zrozumieć:',
    additionalPoliciesLead: 'Dodatkowe polityki dla konkretnych zastosowań:',
    isTranslated: false,
    translationNotice:
      'Szczegółowa treść tej polityki jest obecnie dostępna w języku angielskim.',
  },
  de: {
    navTitle: 'Datenschutzerklärung',
    navAriaLabel: 'Abschnitte der Datenschutzerklärung',
    effectiveDateLabel: 'Gültig ab:',
    effectiveDate: 'October 7, 2025',
    summaryTitle: 'Diese Datenschutzerklärung soll Ihnen helfen zu verstehen:',
    additionalPoliciesLead: 'Zusätzliche Richtlinien für bestimmte Anwendungsfälle:',
    isTranslated: false,
    translationNotice:
      'Der detaillierte Inhalt dieser Richtlinie ist derzeit auf Englisch verfügbar.',
  },
  fr: {
    navTitle: 'Politique de confidentialité',
    navAriaLabel: 'Sections de la politique de confidentialité',
    effectiveDateLabel: 'Entrée en vigueur :',
    effectiveDate: 'October 7, 2025',
    summaryTitle: 'Cette politique de confidentialité vise à vous aider à comprendre :',
    additionalPoliciesLead: 'Politiques supplémentaires pour des cas spécifiques :',
    isTranslated: false,
    translationNotice:
      'Le contenu détaillé de cette politique est actuellement disponible en anglais.',
  },
  es: {
    navTitle: 'Política de privacidad',
    navAriaLabel: 'Secciones de la política de privacidad',
    effectiveDateLabel: 'Vigente desde:',
    effectiveDate: 'October 7, 2025',
    summaryTitle: 'Esta política de privacidad está pensada para ayudarte a entender:',
    additionalPoliciesLead: 'Políticas adicionales para casos de uso específicos:',
    isTranslated: false,
    translationNotice:
      'El contenido detallado de esta política está disponible actualmente en inglés.',
  },
};

const buildLocalizedAdditionalPolicies = (locale: Locale): string[] => {
  if (locale === 'uk') {
    return [
      'Політика cookie та трекінгу',
      'Політика конфіденційності для кандидатів',
      'Політика конфіденційності Marketplace',
      'Політика конфіденційності демографічних опитувань',
    ];
  }
  return EN_ADDITIONAL_POLICIES;
};

const buildLocalizedSections = (locale: Locale): PrivacyPolicySection[] => {
  if (locale === 'uk') return UK_SECTIONS;
  if (locale === 'pl' || locale === 'de' || locale === 'fr' || locale === 'es') {
    const titleMap = SECTION_TITLE_TRANSLATIONS[locale];
    return EN_SECTIONS.map((section) => ({
      ...section,
      title: titleMap?.[section.id] || section.title,
    }));
  }
  return EN_SECTIONS;
};

export const getPrivacyPolicyContent = (locale: Locale): PrivacyPolicyLocaleContent => {
  const meta = BASE_LOCALE_META[locale] ?? BASE_LOCALE_META.en;
  return {
    ...meta,
    additionalPolicies: buildLocalizedAdditionalPolicies(locale),
    sections: buildLocalizedSections(locale),
  };
};

// Backward-compatible EN exports used by existing code paths.
export const PRIVACY_POLICY_TABLE_OF_CONTENTS = EN_SECTIONS.map((section) => ({
  id: section.id,
  label: section.title,
}));
export const PRIVACY_POLICY_EFFECTIVE_DATE = BASE_LOCALE_META.en.effectiveDate;
export const PRIVACY_POLICY_SUMMARY_TITLE = BASE_LOCALE_META.en.summaryTitle;
export const PRIVACY_POLICY_ADDITIONAL_POLICIES_LEAD = BASE_LOCALE_META.en.additionalPoliciesLead;
export const PRIVACY_POLICY_SECTIONS = EN_SECTIONS;
export const PRIVACY_POLICY_ADDITIONAL_POLICIES = EN_ADDITIONAL_POLICIES;
export const PRIVACY_POLICY_PROFILE_PARAGRAPHS = EN_SECTIONS.flatMap((section) => section.paragraphs);
