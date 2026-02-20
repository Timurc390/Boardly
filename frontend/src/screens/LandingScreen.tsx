import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
//import { useAuth } from '../context/AuthContext.tsx.bak';

import { useAppSelector } from '../store/hooks';
import { useI18n } from '../context/I18nContext';
import { KanbanPreview } from '../components/KanbanPreview';

const LANDING_SECTION_COUNT = 3;
const AUTO_SCROLL_INTERVAL_MS = 6500;
const AUTO_SCROLL_PAUSE_MS = 9000;

export const LandingScreen: React.FC = () => {
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { t } = useI18n();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const scrollAnimationRef = useRef<number | null>(null);
  const interactionPauseUntilRef = useRef(0);
  const [activeSection, setActiveSection] = useState(0);
  const ctaHref = isAuthenticated ? '/boards' : '/auth?mode=register';
  const ctaLabel = isAuthenticated ? t('landing.cta.openApp') : t('landing.cta.signUp');

  const messageCards = useMemo(
    () => [
      {
        icon: '/community-redesign/icon-messages.png',
        title: t('community.redesign.actions.messages.title'),
        body: t('community.redesign.actions.messages.body'),
      },
      {
        icon: '/community-redesign/icon-use-automation.png',
        title: t('community.redesign.actions.automation.title'),
        body: t('community.redesign.actions.automation.body'),
      },
      {
        icon: '/community-redesign/icon-communicate.png',
        title: t('community.redesign.actions.communicate.title'),
        body: t('community.redesign.actions.communicate.body'),
      },
    ],
    [t]
  );

  const doMoreCards = useMemo(
    () => [
      {
        icon: '/community-redesign/icon-integrations.png',
        title: t('community.redesign.more.integrations.title'),
        body: t('community.redesign.more.integrations.body'),
      },
      {
        icon: '/community-redesign/icon-automation.png',
        title: t('community.redesign.more.automation.title'),
        body: t('community.redesign.more.automation.body'),
      },
      {
        icon: '/community-redesign/icon-customization.png',
        title: t('community.redesign.more.customization.title'),
        body: t('community.redesign.more.customization.body'),
      },
      {
        icon: '/community-redesign/icon-mobile.png',
        title: t('community.redesign.more.mobile.title'),
        body: t('community.redesign.more.mobile.body'),
      },
    ],
    [t]
  );

  useEffect(() => {
    document.body.classList.add('landing-no-scroll');
    document.documentElement.classList.add('landing-no-scroll');

    return () => {
      document.body.classList.remove('landing-no-scroll');
      document.documentElement.classList.remove('landing-no-scroll');
    };
  }, []);

  useEffect(() => () => {
    if (scrollAnimationRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  }, []);

  useEffect(() => {
    const container = pageRef.current;
    if (!container || typeof window === 'undefined') return undefined;

    const pauseAutoScroll = () => {
      interactionPauseUntilRef.current = Date.now() + AUTO_SCROLL_PAUSE_MS;
    };

    container.addEventListener('wheel', pauseAutoScroll, { passive: true });
    container.addEventListener('touchstart', pauseAutoScroll, { passive: true });
    container.addEventListener('pointerdown', pauseAutoScroll);
    window.addEventListener('keydown', pauseAutoScroll);

    return () => {
      container.removeEventListener('wheel', pauseAutoScroll);
      container.removeEventListener('touchstart', pauseAutoScroll);
      container.removeEventListener('pointerdown', pauseAutoScroll);
      window.removeEventListener('keydown', pauseAutoScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;
        const index = Number((visibleEntry.target as HTMLElement).dataset.sectionIndex || 0);
        setActiveSection(index);
      },
      { root: null, threshold: [0.45, 0.65, 0.85] }
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((index: number, durationOverride?: number) => {
    const target = sectionRefs.current[index];
    const container = pageRef.current;
    if (!target || !container || typeof window === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      container.scrollTop = target.offsetTop;
      return;
    }

    if (scrollAnimationRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }

    const start = container.scrollTop;
    const end = target.offsetTop;
    const distance = end - start;
    if (Math.abs(distance) < 2) return;

    const duration = durationOverride ?? Math.min(2100, Math.max(1150, Math.abs(distance) * 1.2));
    const easeInOutQuint = (value: number) => {
      if (value < 0.5) return 16 * value * value * value * value * value;
      const shifted = -2 * value + 2;
      return 1 - (shifted * shifted * shifted * shifted * shifted) / 2;
    };

    let animationStart = 0;
    const animate = (timestamp: number) => {
      if (animationStart === 0) animationStart = timestamp;
      const elapsed = timestamp - animationStart;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeInOutQuint(progress);
      container.scrollTop = start + distance * easedProgress;

      if (progress < 1) {
        scrollAnimationRef.current = window.requestAnimationFrame(animate);
      } else {
        scrollAnimationRef.current = null;
      }
    };

    scrollAnimationRef.current = window.requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = window.setTimeout(() => {
      if (document.hidden) return;
      if (Date.now() < interactionPauseUntilRef.current) return;
      const nextSection = (activeSection + 1) % LANDING_SECTION_COUNT;
      scrollToSection(nextSection, 1900);
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [activeSection, scrollToSection]);

  const setSectionRef = (index: number) => (node: HTMLElement | null) => {
    sectionRefs.current[index] = node;
  };

  return (
    <div className="landing-page landing-page-v2" ref={pageRef}>
      <div className="landing-dots" aria-label="Landing sections navigation">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to section ${index + 1}`}
            aria-current={activeSection === index ? 'true' : undefined}
            className={`landing-dot ${activeSection === index ? 'is-active' : ''}`}
            onClick={() => {
              interactionPauseUntilRef.current = Date.now() + AUTO_SCROLL_PAUSE_MS;
              scrollToSection(index, 1750);
            }}
          />
        ))}
      </div>

      <section
        ref={setSectionRef(0)}
        data-section-index={0}
        className={`landing-screen landing-screen--hero ${activeSection === 0 ? 'is-active' : ''}`}
      >
        <div className="landing-content">
          <div className="landing-inner">
            <div className="landing-top">
              <div className="landing-brand">
                <img className="landing-brand-icon" src="/logo.png" alt="Boardly logo" decoding="async" />
              </div>
              <div className="landing-logo">Boardly</div>
              <div className="landing-spacer" />
            </div>

            <div className="landing-hero">
              <div className="landing-copy">
                <h1>
                  {t('landing.hero.line1')}
                  <br />
                  {t('landing.hero.line2')}
                  <br />
                  {t('landing.hero.line3')}
                  <br />
                  {t('landing.hero.line4')}
                </h1>
                <p>
                  {t('landing.copy.line1')}
                  <br />
                  {t('landing.copy.line2')}
                  <br />
                  {t('landing.copy.line3')}
                </p>

                <Link className="landing-cta" to={ctaHref}>
                  {ctaLabel}
                </Link>
              </div>

              <div className="landing-media landing-media--kanban" aria-hidden="true">
                <KanbanPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={setSectionRef(1)}
        data-section-index={1}
        className={`landing-screen landing-screen--productivity ${activeSection === 1 ? 'is-active' : ''}`}
      >
        <div className="landing-content landing-content--wide">
          <div className="landing-productivity-grid">
            <div className="landing-productivity-copy">
              <p className="landing-kicker">{t('community.redesign.basicFunctions')}</p>
              <h2>{t('community.redesign.sources.title')}</h2>
              <p className="landing-productivity-subtitle">{t('community.redesign.sources.subtitle')}</p>

              <article className="landing-mini-feature">
                <img src="/community-redesign/icon-move-tasks.png" alt="" loading="lazy" decoding="async" />
                <div>
                  <h3>{t('community.redesign.moveTasks.title')}</h3>
                  <p>{t('community.redesign.moveTasks.body')}</p>
                </div>
              </article>
            </div>

            <div className="landing-productivity-image">
              <img src="/community-redesign/productivity-board.png" alt={t('community.redesign.sources.imageAlt')} loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      <section
        ref={setSectionRef(2)}
        data-section-index={2}
        className={`landing-screen landing-screen--details ${activeSection === 2 ? 'is-active' : ''}`}
      >
        <div className="landing-content landing-content--wide">
          <div className="landing-details-top">
            <h2>{t('community.redesign.actions.heading')}</h2>
            <p>{t('community.redesign.actions.subtitle')}</p>
          </div>

          <div className="landing-card-grid landing-card-grid--three">
            {messageCards.map((item) => (
              <article className="landing-feature-card" key={item.title}>
                <div className="landing-feature-head">
                  <img src={item.icon} alt="" loading="lazy" decoding="async" />
                  <h3>{item.title}</h3>
                </div>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <div className="landing-details-mid">
            <h2>{t('community.redesign.more.heading')}</h2>
            <p>{t('community.redesign.more.subtitle')}</p>
          </div>

          <div className="landing-card-grid landing-card-grid--four">
            {doMoreCards.map((item) => (
              <article className="landing-feature-card" key={item.title}>
                <div className="landing-feature-head">
                  <img src={item.icon} alt="" loading="lazy" decoding="async" />
                  <h3>{item.title}</h3>
                </div>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <div className="landing-signup">
            <h2>{t('community.redesign.signup.title')}</h2>
            <Link className="landing-cta" to={ctaHref}>
              {ctaLabel}
            </Link>
            {!isAuthenticated && (
              <p className="landing-signup-note">
                {t('community.redesign.signup.note')} {t('help.footer.privacyPolicy')}
              </p>
            )}
          </div>

          <footer className="landing-footer">
            <div>{t('help.footer.copyright')}</div>
            <div className="landing-footer-links">
              <span>{t('help.footer.accessibility')}</span>
              <span>{t('help.footer.privacyChoices')}</span>
              <Link to="/privacy-policy">{t('help.footer.privacyPolicy')}</Link>
              <span>{t('help.footer.terms')}</span>
              <span>{t('help.footer.impressum')}</span>
              <span>{t('help.footer.security')}</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};
