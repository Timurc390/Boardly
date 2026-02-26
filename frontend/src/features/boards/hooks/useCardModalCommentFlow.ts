import { useCallback, useLayoutEffect, useRef, useState } from 'react';

type UseCardModalCommentFlowParams = {
  isOpen: boolean;
  cardId: number;
  commentsLength: number;
  checklistsLength: number;
};

export const useCardModalCommentFlow = ({
  isOpen,
  cardId,
  commentsLength,
  checklistsLength,
}: UseCardModalCommentFlowParams) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsMaxHeight, setCommentsMaxHeight] = useState<number | null>(null);
  const mainColRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !mainColRef.current || typeof window === 'undefined') return undefined;

    const syncHeight = () => {
      const next = mainColRef.current?.offsetHeight || 0;
      setCommentsMaxHeight(next > 0 ? next : null);
    };

    syncHeight();
    window.addEventListener('resize', syncHeight);

    let observer: ResizeObserver | null = null;
    if ('ResizeObserver' in window && mainColRef.current) {
      observer = new ResizeObserver(() => syncHeight());
      observer.observe(mainColRef.current);
    }

    return () => {
      window.removeEventListener('resize', syncHeight);
      observer?.disconnect();
    };
  }, [isOpen, cardId, commentsLength, checklistsLength, isCommentsOpen]);

  const closeComments = useCallback(() => {
    setIsCommentsOpen(false);
  }, []);

  const handleToggleComments = useCallback((onOpen?: () => void) => {
    setIsCommentsOpen((prev) => {
      const next = !prev;
      if (next) {
        onOpen?.();
      }
      return next;
    });
  }, []);

  return {
    isCommentsOpen,
    commentsMaxHeight,
    mainColRef,
    setIsCommentsOpen,
    closeComments,
    handleToggleComments,
  };
};
