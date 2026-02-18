import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { useAppSelector } from '../store/hooks';

export const CommunityScreen: React.FC = () => {
  const { t } = useI18n();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const revealNodes = Array.from(
      root.querySelectorAll<HTMLElement>('.community-rd-reveal')
    );

    if (!revealNodes.length) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      revealNodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );

    revealNodes.forEach((node, index) => {
      if (index < 2) {
        node.classList.add('is-visible');
        return;
      }
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  const withDelay = (delayMs: number): React.CSSProperties => ({
    ['--rd-delay' as any]: `${delayMs}ms`
  });
  const withVisitDelay = (delayMs: number): React.CSSProperties => ({
    ['--visit-delay' as any]: `${delayMs}ms`
  });
  const ctaHref = isAuthenticated ? '/boards' : '/auth?mode=register';
  const ctaLabel = isAuthenticated ? t('landing.cta.openApp') : t('community.redesign.hero.cta');

  const messageCards = [
    {
      icon: '/community-redesign/icon-messages.png',
      titleKey: 'community.redesign.actions.messages.title',
      bodyKey: 'community.redesign.actions.messages.body'
    },
    {
      icon: '/community-redesign/icon-use-automation.png',
      titleKey: 'community.redesign.actions.automation.title',
      bodyKey: 'community.redesign.actions.automation.body'
    },
    {
      icon: '/community-redesign/icon-communicate.png',
      titleKey: 'community.redesign.actions.communicate.title',
      bodyKey: 'community.redesign.actions.communicate.body'
    }
  ];

  const doMoreCards = [
    {
      icon: '/community-redesign/icon-integrations.png',
      titleKey: 'community.redesign.more.integrations.title',
      bodyKey: 'community.redesign.more.integrations.body'
    },
    {
      icon: '/community-redesign/icon-automation.png',
      titleKey: 'community.redesign.more.automation.title',
      bodyKey: 'community.redesign.more.automation.body'
    },
    {
      icon: '/community-redesign/icon-customization.png',
      titleKey: 'community.redesign.more.customization.title',
      bodyKey: 'community.redesign.more.customization.body'
    },
    {
      icon: '/community-redesign/icon-mobile.png',
      titleKey: 'community.redesign.more.mobile.title',
      bodyKey: 'community.redesign.more.mobile.body'
    }
  ];

  if (isAuthenticated) {
    const getStartedCards = [
      {
        icon: '/community/forums.png',
        titleKey: 'community.getStarted.forums.title',
        bodyKey: 'community.getStarted.forums.body'
      },
      {
        icon: '/community/learning.png',
        titleKey: 'community.getStarted.learning.title',
        bodyKey: 'community.getStarted.learning.body'
      },
      {
        icon: '/community/events.png',
        titleKey: 'community.getStarted.events.title',
        bodyKey: 'community.getStarted.events.body'
      },
      {
        icon: '/community/champions.png',
        titleKey: 'community.getStarted.champions.title',
        bodyKey: 'community.getStarted.champions.body'
      }
    ];

    return (
      <div className="community-page community-page-redesign community-visit-page">
        <section className="community-hero community-visit-reveal" style={withVisitDelay(40)}>
          <div className="community-brand">Boardly</div>
          <div className="community-hero-inner">
            <Link className="community-back-link" to="/boards">
              &lt; {t('community.back')}
            </Link>
            <div className="community-hero-content">
              <h1>{t('community.title')}</h1>
              <p>{t('community.subtitle')}</p>
            </div>
          </div>
        </section>

        <div className="community-shell">
          <section className="community-get-started community-visit-reveal" style={withVisitDelay(120)}>
            <h2>{t('community.getStarted.title')}</h2>
            <div className="community-start-grid">
              {getStartedCards.map((card, index) => (
                <article
                  className="community-card community-visit-reveal"
                  style={withVisitDelay(160 + index * 80)}
                  key={card.titleKey}
                >
                  <div className="community-card-icon" aria-hidden="true">
                    <img src={card.icon} alt="" loading="lazy" decoding="async" />
                  </div>
                  <h3 className="community-card-title">{t(card.titleKey)}</h3>
                  <p className="community-card-body">{t(card.bodyKey)}</p>
                  <Link className="community-card-link" to="/help">
                    {t('community.getStarted.link')}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="community-feature community-feature--advice community-visit-reveal" style={withVisitDelay(260)}>
            <p className="community-feature-kicker">{t('community.kicker.forums')}</p>
            <h3>{t('community.advice.title')}</h3>
            <p>{t('community.advice.body')}</p>
            <div className="community-feature-image community-feature-image--wide">
              <img src="/community/community-banner.png" alt={t('community.advice.title')} loading="lazy" decoding="async" />
            </div>
          </section>

          <section className="community-feature community-feature--learning community-visit-reveal" style={withVisitDelay(320)}>
            <p className="community-feature-kicker">{t('community.kicker.forums')}</p>
            <h3>{t('community.learning.title')}</h3>
            <p>{t('community.learning.body')}</p>
            <div className="community-learning-grid">
              <div className="community-feature-image community-feature-image--portrait">
                <img src="/community/learning-photo.png" alt={t('community.learning.title')} loading="lazy" decoding="async" />
              </div>
              <p className="community-learning-copy">{t('community.learning.longBody')}</p>
            </div>
          </section>
        </div>

        <footer className="community-footer community-visit-reveal" style={withVisitDelay(380)}>
          <div>{t('help.footer.copyright')}</div>
          <div className="help-footer-links">
            <span>{t('help.footer.accessibility')}</span>
            <span>{t('help.footer.privacyChoices')}</span>
            <Link to="/privacy-policy">{t('help.footer.privacyPolicy')}</Link>
            <span>{t('help.footer.terms')}</span>
            <span>{t('help.footer.impressum')}</span>
            <span>{t('help.footer.security')}</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="community-page community-page-redesign community-rd-page" ref={pageRef}>
      <section className="community-rd-hero">
        <div className="community-rd-container">
          <header className="community-rd-header community-rd-reveal" style={withDelay(40)}>
            <div className="community-rd-brand">Boardly</div>
          </header>

          <div className="community-rd-hero-grid">
            <div className="community-rd-hero-copy community-rd-reveal" style={withDelay(120)}>
              <h1>{t('community.redesign.hero.title')}</h1>
              <p>{t('community.redesign.hero.subtitle')}</p>
              <Link className="community-rd-cta" to={ctaHref}>
                {ctaLabel}
              </Link>
            </div>

            <div className="community-rd-hero-visual community-rd-reveal" style={withDelay(230)} aria-hidden="true">
              <div className="community-rd-board">
                <div className="community-rd-board-column community-rd-board-column--todo">
                  <h3>{t('community.redesign.preview.todo.title')}</h3>
                  <div className="community-rd-board-task">
                    {t('community.redesign.preview.todo.task1')}
                  </div>
                  <div className="community-rd-board-task">
                    {t('community.redesign.preview.todo.task2')}
                  </div>
                  <div className="community-rd-board-task">
                    {t('community.redesign.preview.todo.task3')}
                  </div>
                </div>

                <div className="community-rd-board-column community-rd-board-column--progress">
                  <h3>{t('community.redesign.preview.progress.title')}</h3>
                  <div className="community-rd-board-task community-rd-board-task--progress">
                    <span>{t('community.redesign.preview.progress.task')}</span>
                    <div className="community-rd-avatars">
                      <span className="community-rd-avatar community-rd-avatar--a">A</span>
                      <span className="community-rd-avatar community-rd-avatar--b">B</span>
                      <span className="community-rd-avatar community-rd-avatar--c">C</span>
                    </div>
                  </div>
                </div>

                <div className="community-rd-board-column community-rd-board-column--done">
                  <h3>{t('community.redesign.preview.done.title')}</h3>
                  <div className="community-rd-board-task community-rd-board-task--done">[x]</div>
                  <div className="community-rd-board-task community-rd-board-task--done">[x]</div>
                  <div className="community-rd-board-task community-rd-board-task--done">[x]</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="community-rd-content">
        <div className="community-rd-container">
          <section className="community-rd-productivity community-rd-reveal">
            <p className="community-rd-kicker">{t('community.redesign.basicFunctions')}</p>
            <h2>{t('community.redesign.sources.title')}</h2>
            <p className="community-rd-section-text">{t('community.redesign.sources.subtitle')}</p>

            <div className="community-rd-productivity-grid">
              <article className="community-rd-mini-feature community-rd-reveal" style={withDelay(120)}>
                <img src="/community-redesign/icon-move-tasks.png" alt="" loading="lazy" decoding="async" />
                <div className="community-rd-mini-feature-copy">
                  <h3>{t('community.redesign.moveTasks.title')}</h3>
                  <p>{t('community.redesign.moveTasks.body')}</p>
                </div>
              </article>
              <div className="community-rd-productivity-image community-rd-reveal" style={withDelay(220)}>
                <img src="/community-redesign/productivity-board.png" alt={t('community.redesign.sources.imageAlt')} loading="lazy" decoding="async" />
              </div>
            </div>
          </section>

          <section className="community-rd-actions community-rd-reveal">
            <h2>{t('community.redesign.actions.heading')}</h2>
            <p className="community-rd-section-text">{t('community.redesign.actions.subtitle')}</p>
            <div className="community-rd-card-grid community-rd-card-grid--three">
              {messageCards.map((item, idx) => (
                <article className="community-rd-feature-card community-rd-reveal" style={withDelay(120 + idx * 90)} key={item.titleKey}>
                  <div className="community-rd-feature-head">
                    <img src={item.icon} alt="" loading="lazy" decoding="async" />
                    <h3>{t(item.titleKey)}</h3>
                  </div>
                  <p>{t(item.bodyKey)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="community-rd-more community-rd-reveal">
            <h2>{t('community.redesign.more.heading')}</h2>
            <p className="community-rd-section-text">{t('community.redesign.more.subtitle')}</p>
            <div className="community-rd-card-grid community-rd-card-grid--four">
              {doMoreCards.map((item, idx) => (
                <article className="community-rd-feature-card community-rd-reveal" style={withDelay(120 + idx * 80)} key={item.titleKey}>
                  <div className="community-rd-feature-head">
                    <img src={item.icon} alt="" loading="lazy" decoding="async" />
                    <h3>{t(item.titleKey)}</h3>
                  </div>
                  <p>{t(item.bodyKey)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="community-rd-signup community-rd-reveal">
            <h2>{t('community.redesign.signup.title')}</h2>
            <Link className="community-rd-cta" to={ctaHref}>
              {ctaLabel}
            </Link>
            {!isAuthenticated && (
              <p className="community-rd-signup-note">
                {t('community.redesign.signup.note')}{' '}
                <Link to="/privacy-policy">{t('community.redesign.signup.privacy')}</Link>
              </p>
            )}
          </section>
        </div>
      </section>

      <footer className="help-footer community-rd-footer">
        <div className="help-footer-left">{t('help.footer.copyright')}</div>
        <div className="help-footer-links">
          <span>{t('help.footer.accessibility')}</span>
          <span>{t('help.footer.privacyChoices')}</span>
          <Link to="/privacy-policy">{t('help.footer.privacyPolicy')}</Link>
          <span>{t('help.footer.terms')}</span>
          <span>{t('help.footer.impressum')}</span>
          <span>{t('help.footer.security')}</span>
        </div>
      </footer>
    </div>
  );
};
