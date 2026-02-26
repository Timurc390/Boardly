import { RefObject, useEffect } from 'react';
import { fetchBoardById } from '../../../store/slices/boardSlice';
import { AppDispatch } from '../../../store/store';

type UseBoardPollingOptions = {
  boardIdParam?: string;
  isLive: boolean;
  isAnyDragRef: RefObject<boolean>;
  dispatch: AppDispatch;
};

export const useBoardPolling = ({
  boardIdParam,
  isLive,
  isAnyDragRef,
  dispatch,
}: UseBoardPollingOptions) => {
  useEffect(() => {
    if (!boardIdParam) return;
    let timer: number | null = null;
    let stopped = false;
    const intervalMs = isLive ? 60000 : 15000;

    const poll = () => {
      if (stopped) return;
      if (isAnyDragRef.current) {
        timer = window.setTimeout(poll, intervalMs);
        return;
      }
      if (typeof document !== 'undefined' && document.hidden) {
        timer = window.setTimeout(poll, intervalMs);
        return;
      }
      dispatch(fetchBoardById(Number(boardIdParam)));
      timer = window.setTimeout(poll, intervalMs);
    };

    timer = window.setTimeout(poll, intervalMs);
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [boardIdParam, dispatch, isAnyDragRef, isLive]);
};
