import { useEffect, useState } from 'react';

export const useBoardTouchLayout = (boardId?: number) => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaCoarse = window.matchMedia('(pointer: coarse)');
    const mediaNoHover = window.matchMedia('(hover: none)');
    const update = () => {
      setIsTouch(mediaCoarse.matches && mediaNoHover.matches);
    };
    update();
    if (mediaCoarse.addEventListener && mediaNoHover.addEventListener) {
      mediaCoarse.addEventListener('change', update);
      mediaNoHover.addEventListener('change', update);
      return () => {
        mediaCoarse.removeEventListener('change', update);
        mediaNoHover.removeEventListener('change', update);
      };
    }
    mediaCoarse.addListener(update);
    mediaNoHover.addListener(update);
    return () => {
      mediaCoarse.removeListener(update);
      mediaNoHover.removeListener(update);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const touchClass = 'board-touch-active';
    if (isTouch) {
      document.body.classList.add(touchClass);
    } else {
      document.body.classList.remove(touchClass);
    }
    return () => {
      document.body.classList.remove(touchClass);
    };
  }, [isTouch]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const root = document.documentElement;
    const fallbackOffset = 56;
    const syncHeaderOffset = () => {
      const header = document.querySelector('.board-detail-page .board-header') as HTMLElement | null;
      const measured = header?.getBoundingClientRect().height ?? fallbackOffset;
      const normalized = Math.max(fallbackOffset, Math.round(measured));
      root.style.setProperty('--board-touch-header-offset', `${normalized}px`);
    };

    if (!isTouch) {
      root.style.setProperty('--board-touch-header-offset', `${fallbackOffset}px`);
      return;
    }

    const raf = window.requestAnimationFrame(syncHeaderOffset);
    window.addEventListener('resize', syncHeaderOffset);
    window.addEventListener('orientationchange', syncHeaderOffset);
    window.visualViewport?.addEventListener('resize', syncHeaderOffset);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', syncHeaderOffset);
      window.removeEventListener('orientationchange', syncHeaderOffset);
      window.visualViewport?.removeEventListener('resize', syncHeaderOffset);
      root.style.setProperty('--board-touch-header-offset', `${fallbackOffset}px`);
    };
  }, [isTouch, boardId]);

  return isTouch;
};
