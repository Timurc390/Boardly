import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import {
  getPrivacyPolicyContent,
} from '../content/privacyPolicyContent';

export const PrivacyPolicyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const policyContent = React.useMemo(() => getPrivacyPolicyContent(locale), [locale]);
  const [overviewSection, ...detailSections] = policyContent.sections;
  const toc = React.useMemo(
    () => policyContent.sections.map((section) => ({ id: section.id, label: section.title })),
    [policyContent.sections]
  );

  const footerItems = [
    t('privacy.footer.accessibility'),
    t('privacy.footer.choices'),
    t('privacy.footer.policy'),
    t('privacy.footer.terms'),
    t('privacy.footer.data'),
    t('privacy.footer.security'),
  ];

  return (
    <div className="privacy-policy-page">
      <header className="privacy-policy-header pp-reveal" style={{ ['--pp-delay' as any]: '40ms' }}>
        <Link to="/" className="privacy-policy-brand">
          Boardly
        </Link>
      </header>

      <main className="privacy-policy-main">
        <section className="privacy-policy-hero pp-reveal" style={{ ['--pp-delay' as any]: '90ms' }}>
          <button type="button" className="privacy-policy-back" onClick={() => navigate(-1)}>
            <span aria-hidden="true">←</span>
            <span>{t('community.back')}</span>
          </button>
          <h1>{t('privacy.footer.policy')}</h1>
          <p className="privacy-policy-effective">
            {policyContent.effectiveDateLabel} {policyContent.effectiveDate}
          </p>
        </section>

        <div className="privacy-policy-layout">
          <aside className="privacy-policy-nav pp-reveal" style={{ ['--pp-delay' as any]: '140ms' }}>
            <h2>{policyContent.navTitle}</h2>
            <nav aria-label={policyContent.navAriaLabel}>
              <ul>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="privacy-policy-content-wrap">
            <section
              id={overviewSection?.id || 'overview'}
              className="privacy-policy-intro pp-reveal"
              style={{ ['--pp-delay' as any]: '180ms' }}
            >
              {(overviewSection?.paragraphs || []).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {policyContent.translationNotice && (
                <p>{policyContent.translationNotice}</p>
              )}
              <p>{policyContent.summaryTitle}</p>
              <ul className="privacy-policy-summary-list">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.label}</a>
                  </li>
                ))}
              </ul>
              <p>{policyContent.additionalPoliciesLead}</p>
              <ul className="privacy-policy-extra-list">
                {policyContent.additionalPolicies.map((policy) => (
                  <li key={policy}>{policy}</li>
                ))}
              </ul>
            </section>

            {detailSections.map((section, index) => (
              <section
                id={section.id}
                key={section.id}
                className="privacy-policy-section pp-reveal"
                style={{ ['--pp-delay' as any]: `${220 + index * 40}ms` }}
              >
                <h3>{section.title}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </article>
        </div>
      </main>

      <footer className="privacy-policy-footer pp-reveal" style={{ ['--pp-delay' as any]: '280ms' }}>
        <div className="privacy-policy-footer-inner">
          <span>Copyright © 2026 Boardly</span>
          <div className="privacy-policy-footer-links">
            {footerItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
