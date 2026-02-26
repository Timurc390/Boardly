import { useCallback, useEffect, useRef, useState } from 'react';
import { BeforeCapture, DragStart, DragUpdate, DropResult } from '@hello-pangea/dnd';
import { getEdgeAutoScrollDelta, parseEntityId } from '../utils/dragAutoScroll';

type UseBoardDnDOptions = {
  onMoveList: (listId: number, fromIndex: number, toIndex: number) => void;
  onMoveCard: (cardId: number, sourceListId: number, destListId: number, destIndex: number) => void;
  closeTransientOverlays: (options?: {
    keepSidebar?: boolean;
    keepFilter?: boolean;
    keepActivity?: boolean;
  }) => void;
};

export const useBoardDnD = ({
  onMoveList,
  onMoveCard,
  closeTransientOverlays,
}: UseBoardDnDOptions) => {
  const [dragDropContextKey, setDragDropContextKey] = useState(0);
  const isAnyDragRef = useRef(false);
  const activeDragIdRef = useRef<string | null>(null);
  const activeDragTypeRef = useRef<'list' | 'card' | null>(null);
  const activeSourceRef = useRef<{ index: number; droppableId: string } | null>(null);
  const latestDestinationRef = useRef<{ index: number; droppableId: string } | null>(null);
  const fallbackEndTimerRef = useRef<number | null>(null);
  const dragPointerRef = useRef({ x: Number.NaN, y: Number.NaN });
  const draggingTypeRef = useRef<'card' | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const onMoveListRef = useRef(onMoveList);
  const onMoveCardRef = useRef(onMoveCard);

  const resetDragRefs = useCallback(() => {
    activeDragIdRef.current = null;
    activeDragTypeRef.current = null;
    activeSourceRef.current = null;
    latestDestinationRef.current = null;
    if (fallbackEndTimerRef.current !== null) {
      window.clearTimeout(fallbackEndTimerRef.current);
      fallbackEndTimerRef.current = null;
    }
  }, []);

  const remountDragDropContext = useCallback(() => {
    // Force-reset @hello-pangea/dnd internal sensor state when native onDragEnd is lost.
    setDragDropContextKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    onMoveListRef.current = onMoveList;
  }, [onMoveList]);

  useEffect(() => {
    onMoveCardRef.current = onMoveCard;
  }, [onMoveCard]);

  const stopAutoScroll = useCallback(() => {
    draggingTypeRef.current = null;
    if (autoScrollRafRef.current !== null) {
      window.cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const forceFinishListDrag = useCallback((reason: 'pointer-up-timeout') => {
    if (!isAnyDragRef.current) return;
    if (activeDragTypeRef.current !== 'list') return;
    const dragId = activeDragIdRef.current;
    const source = activeSourceRef.current;
    const destination = latestDestinationRef.current;

    isAnyDragRef.current = false;
    stopAutoScroll();

    if (!dragId || !source || !destination) {
      resetDragRefs();
      remountDragDropContext();
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      resetDragRefs();
      remountDragDropContext();
      return;
    }

    const listId = parseEntityId(dragId, 'list-');
    if (!listId) {
      resetDragRefs();
      remountDragDropContext();
      return;
    }

    onMoveListRef.current(listId, source.index, destination.index);
    resetDragRefs();
    remountDragDropContext();
  }, [remountDragDropContext, resetDragRefs, stopAutoScroll]);

  const runAutoScroll = useCallback(() => {
    const draggingType = draggingTypeRef.current;
    if (!draggingType) {
      autoScrollRafRef.current = null;
      return;
    }

    const pointer = dragPointerRef.current;
    const hasPointer = Number.isFinite(pointer.x) && Number.isFinite(pointer.y);

    if (draggingType === 'card' && hasPointer) {
      const target = document.elementFromPoint(pointer.x, pointer.y) as HTMLElement | null;
      const listBody = target?.closest('.list-body') as HTMLElement | null;
      if (listBody) {
        const rect = listBody.getBoundingClientRect();
        const verticalDelta = getEdgeAutoScrollDelta(pointer.y, rect.top, rect.bottom, 74, 4, 24);
        if (verticalDelta !== 0) {
          listBody.scrollTop += verticalDelta;
        }
      }
    }

    autoScrollRafRef.current = window.requestAnimationFrame(runAutoScroll);
  }, []);

  const startAutoScroll = useCallback(
    (type: 'card') => {
      draggingTypeRef.current = type;
      if (autoScrollRafRef.current !== null) return;
      autoScrollRafRef.current = window.requestAnimationFrame(runAutoScroll);
    },
    [runAutoScroll]
  );

  useEffect(() => {
    const updatePointer = (x: number, y: number) => {
      dragPointerRef.current = { x, y };
    };

    const handleMouseMove = (event: MouseEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0] || event.changedTouches[0];
      if (!touch) return;
      updatePointer(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    const handlePointerUp = () => {
      if (!isAnyDragRef.current) return;
      if (activeDragTypeRef.current !== 'list') return;
      if (fallbackEndTimerRef.current !== null) {
        window.clearTimeout(fallbackEndTimerRef.current);
      }
      fallbackEndTimerRef.current = window.setTimeout(() => {
        forceFinishListDrag('pointer-up-timeout');
      }, 60);
    };

    window.addEventListener('mouseup', handlePointerUp, true);
    window.addEventListener('touchend', handlePointerUp, true);
    return () => {
      window.removeEventListener('mouseup', handlePointerUp, true);
      window.removeEventListener('touchend', handlePointerUp, true);
    };
  }, [forceFinishListDrag]);

  useEffect(() => {
    return () => {
      resetDragRefs();
      stopAutoScroll();
    };
  }, [resetDragRefs, stopAutoScroll]);

  const onBeforeCapture = useCallback((_start: BeforeCapture) => {}, []);

  const onBeforeDragStart = useCallback((_start: DragStart) => {}, []);

  const onDragStart = useCallback(
    (start: DragStart) => {
      isAnyDragRef.current = true;
      activeDragIdRef.current = start.draggableId;
      activeDragTypeRef.current = start.type === 'list' ? 'list' : 'card';
      activeSourceRef.current = {
        index: start.source.index,
        droppableId: start.source.droppableId,
      };
      latestDestinationRef.current = null;
      // Closing multiple overlays at drag start can trigger synchronous rerenders
      // and interrupt list DnD before onDragEnd fires. Keep list drag start side-effect free.
      if (start.type === 'card') {
        closeTransientOverlays({ keepSidebar: true, keepFilter: true, keepActivity: true });
      }
      if (start.type === 'card') {
        dragPointerRef.current = { x: Number.NaN, y: Number.NaN };
        startAutoScroll('card');
      } else {
        stopAutoScroll();
      }
    },
    [closeTransientOverlays, startAutoScroll, stopAutoScroll]
  );

  const onDragUpdate = useCallback((update: DragUpdate) => {
    latestDestinationRef.current = update.destination
      ? { index: update.destination.index, droppableId: update.destination.droppableId }
      : null;
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      isAnyDragRef.current = false;
      stopAutoScroll();
      const { destination, source, type, draggableId } = result;
      if (!destination) {
        resetDragRefs();
        return;
      }
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        resetDragRefs();
        return;
      }

      if (type === 'list') {
        const listId = parseEntityId(draggableId, 'list-');
        if (!listId) {
          resetDragRefs();
          return;
        }
        onMoveListRef.current(listId, source.index, destination.index);
        resetDragRefs();
        return;
      }

      const cardId = parseEntityId(draggableId, 'card-');
      const sourceListId = parseEntityId(source.droppableId, 'list-');
      const destListId = parseEntityId(destination.droppableId, 'list-');
      if (!cardId || !sourceListId || !destListId) {
        resetDragRefs();
        return;
      }
      onMoveCardRef.current(cardId, sourceListId, destListId, destination.index);
      resetDragRefs();
    },
    [resetDragRefs, stopAutoScroll]
  );

  return {
    dragDropContextKey,
    isAnyDragRef,
    isListDragging: false,
    onBeforeCapture,
    onBeforeDragStart,
    onDragStart,
    onDragUpdate,
    onDragEnd,
  };
};
