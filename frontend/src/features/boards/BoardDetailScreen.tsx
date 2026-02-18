import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { DragDropContext, Droppable, DropResult, DragStart } from '@hello-pangea/dnd';
import { BoardColumn } from './components/BoardColumn';
import { CardModal } from './components/CardModal';
import { BoardHeader } from './components/BoardHeader';
import { BoardMenuSidebar } from './components/BoardMenuSidebar';
import { BoardFiltersModal } from './components/BoardFiltersModal';
import { BoardActivityModal } from './components/BoardActivityModal';
import { Button } from '../../components/ui/Button';
import { useI18n } from '../../context/I18nContext';
import { Card, ActivityLog, Board, List } from '../../types';
import { getBoardActivity } from './api';
import { getEdgeAutoScrollDelta, parseEntityId } from './utils/dragAutoScroll';
import { useOverlayManager } from './hooks/useOverlayManager';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  fetchBoardById, 
  updateBoardAction, 
  deleteBoardAction, 
  toggleFavoriteAction, 
  removeBoardMemberAction,
  addListAction,
  updateListAction,
  updateListOptimistic,
  deleteListAction,
  copyListAction,
  moveListAction,
  addCardAction,
  updateCardAction,
  deleteCardAction,
  copyCardAction,
  moveCardAction,
  moveCardOptimistic,
  moveListOptimistic,
  addChecklistAction,
  deleteChecklistAction,
  addChecklistItemAction,
  updateChecklistItemAction,
  deleteChecklistItemAction,
  addCommentAction,
  updateCommentAction,
  deleteCommentAction,
  createLabelAction,
  updateLabelAction,
  deleteLabelAction,
  joinCardAction,
  leaveCardAction,
  removeCardMemberAction,
  addCardMemberAction,
  addAttachmentAction,
  deleteAttachmentAction,
  clearCurrentBoard,
  updateBoardMemberRoleAction
} from '../../store/slices/boardSlice';
import { logoutUser } from '../../store/slices/authSlice';

type BoardMember = NonNullable<Board['members']>[number];

export const BoardDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t } = useI18n();

  const { user } = useAppSelector(state => state.auth);
  const { currentBoard: board, loading: isLoading, error, isLive } = useAppSelector(state => state.board);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [activeMenuTab, setActiveMenuTab] = useState<'main' | 'background' | 'members' | 'archived' | 'permissions'>('main');
  const [boardTitle, setBoardTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [collapsedLists, setCollapsedLists] = useState<number[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterMemberId, setFilterMemberId] = useState<number | ''>('');
  const [filterLabelId, setFilterLabelId] = useState<number | ''>('');
  const [filterDue, setFilterDue] = useState<'all' | 'overdue' | 'today' | 'week' | 'no_due'>('all');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [bgUrlInput, setBgUrlInput] = useState('');
  const [isTouch, setIsTouch] = useState(false);
  const [boardIconFailed, setBoardIconFailed] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [activeMemberId, setActiveMemberId] = useState<number | null>(null);
  const [activityMember, setActivityMember] = useState<BoardMember | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const boardCanvasRef = useRef<HTMLDivElement | null>(null);
  const dragPointerRef = useRef({ x: 0, y: 0 });
  const draggingTypeRef = useRef<'list' | 'card' | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const {
    isMenuOpen,
    isFilterOpen,
    isGlobalMenuOpen,
    openListMenuId,
    headerMemberId,
    headerOverlayCloseSignal,
    isActivityOpen,
    closeTransientOverlays,
    toggleGlobalMenu,
    closeGlobalMenu,
    toggleListMenu,
    closeListMenu,
    toggleHeaderMember,
    closeHeaderMember,
    openSidebar,
    closeSidebar,
    openFilter,
    closeFilter,
    openActivity,
    closeActivity,
    prepareHeaderMembersPanel
  } = useOverlayManager();

  const updateSearch = useCallback((value: string) => {
    const params = new URLSearchParams(location.search);
    if (value) params.set('q', value);
    else params.delete('q');
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (id) {
      dispatch(fetchBoardById(Number(id)));
    }
    return () => {
      dispatch(clearCurrentBoard());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (!id) return;
    let timer: number | null = null;
    let stopped = false;
    const intervalMs = isLive ? 20000 : 5000;

    const poll = () => {
      if (stopped) return;
      if (typeof document !== 'undefined' && document.hidden) {
        timer = window.setTimeout(poll, intervalMs);
        return;
      }
      dispatch(fetchBoardById(Number(id)));
      timer = window.setTimeout(poll, intervalMs);
    };

    timer = window.setTimeout(poll, intervalMs);
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [id, dispatch, isLive]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaNarrow = window.matchMedia('(max-width: 980px)');
    const mediaCoarse = window.matchMedia('(pointer: coarse)');
    const update = () => {
      setIsTouch(mediaNarrow.matches || mediaCoarse.matches);
    };
    update();
    if (mediaNarrow.addEventListener && mediaCoarse.addEventListener) {
      mediaNarrow.addEventListener('change', update);
      mediaCoarse.addEventListener('change', update);
      return () => {
        mediaNarrow.removeEventListener('change', update);
        mediaCoarse.removeEventListener('change', update);
      };
    }
    mediaNarrow.addListener(update);
    mediaCoarse.addListener(update);
    return () => {
      mediaNarrow.removeListener(update);
      mediaCoarse.removeListener(update);
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
  }, [isTouch, board?.id]);

  useEffect(() => {
    if (board) setBoardTitle(board.title);
  }, [board]);

  const selectedCardId = selectedCard?.id;

  useEffect(() => {
    closeTransientOverlays();
  }, [board?.id, closeTransientOverlays]);

  useEffect(() => {
    if (!selectedCardId) return;
    closeTransientOverlays();
  }, [closeTransientOverlays, selectedCardId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setFilterQuery(q);
  }, [location.search]);

  const boardId = board?.id ?? 0;
  const isOwner = board?.owner?.id === user?.id;
  const currentMembership = board?.members?.find((m: BoardMember) => m.user.id === user?.id);
  const role = currentMembership?.role;
  const isAdmin = role === 'admin';
  const isDeveloper = role === 'developer';
  const canManageMembers = isOwner || isAdmin;
  const canEditBoard = isOwner || isAdmin;
  const canCreateList = canEditBoard || (isDeveloper && !!board?.dev_can_create_lists);
  const canLeaveBoard = !!currentMembership && !isOwner;
  const canAddCardToList = useCallback((list: List) => {
    if (canEditBoard) return true;
    if (isDeveloper && board?.dev_can_create_cards && list.allow_dev_add_cards) return true;
    return false;
  }, [board?.dev_can_create_cards, canEditBoard, isDeveloper]);
  const canEditCard = useCallback((card: Card) => {
    if (canEditBoard) return true;
    if (isDeveloper && board?.dev_can_edit_assigned_cards && card.members?.some(m => m.id === user?.id)) {
      return true;
    }
    return false;
  }, [board?.dev_can_edit_assigned_cards, canEditBoard, isDeveloper, user?.id]);
  const boardCards = useMemo(
    () => board?.lists?.flatMap((list: List) => list.cards || []) || [],
    [board?.lists]
  );
  const boardListsById = useMemo(() => {
    const next = new Map<number, List>();
    (board?.lists || []).forEach((list: List) => next.set(list.id, list));
    return next;
  }, [board?.lists]);
  const activeLists = useMemo(() => board?.lists?.filter((l: List) => !l.is_archived) || [], [board?.lists]);
  const archivedLists = useMemo(() => board?.lists?.filter((l: List) => l.is_archived) || [], [board?.lists]);
  const archivedCards = useMemo(
    () => board?.lists?.flatMap((l: List) => (l.cards || []).filter((c: Card) => c.is_archived)) || [],
    [board?.lists]
  );

  useEffect(() => {
    if (!selectedCardId) return;
    const foundCard = boardCards.find((c: Card) => c.id === selectedCardId);
    if (foundCard) {
      setSelectedCard(foundCard);
    }
  }, [boardCards, selectedCardId]);

  useEffect(() => {
    if (!board) return;
    const params = new URLSearchParams(location.search);
    const cardId = params.get('card');
    if (!cardId) return;
    const foundCard = boardCards.find((c: Card) => c.id === Number(cardId));
    if (foundCard) setSelectedCard(foundCard);
  }, [board, boardCards, location.search]);

  const matchesFilters = useCallback((card: Card) => {
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      const title = card.title?.toLowerCase() || '';
      const desc = card.description?.toLowerCase() || '';
      if (!title.includes(q) && !desc.includes(q)) return false;
    }
    if (filterMemberId) {
      if (!card.members?.some(m => m.id === filterMemberId)) return false;
    }
    if (filterLabelId) {
      if (!card.labels?.some(l => l.id === filterLabelId)) return false;
    }
    if (filterCompleted === 'completed' && !card.is_completed) return false;
    if (filterCompleted === 'incomplete' && card.is_completed) return false;

    if (filterDue !== 'all') {
      if (!card.due_date) {
        if (filterDue !== 'no_due') return false;
      } else {
        const due = new Date(card.due_date);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        if (filterDue === 'overdue' && !(due < startOfToday)) return false;
        if (filterDue === 'today' && !(due >= startOfToday && due < endOfToday)) return false;
        if (filterDue === 'week' && !(due >= startOfToday && due < endOfWeek)) return false;
        if (filterDue === 'no_due') return false;
      }
    }
    return true;
  }, [filterCompleted, filterDue, filterLabelId, filterMemberId, filterQuery]);

  const isFiltering = !!(
    filterQuery ||
    filterMemberId ||
    filterLabelId ||
    filterDue !== 'all' ||
    filterCompleted !== 'all'
  );

  const filteredLists = useMemo(() => {
    if (!isFiltering) return activeLists;
    return activeLists.map((list: List) => ({
      ...list,
      cards: (list.cards || []).filter((c: Card) => !c.is_archived && matchesFilters(c))
    }));
  }, [activeLists, isFiltering, matchesFilters]);
  const listOptions = useMemo(
    () => filteredLists.map((item: List) => ({ id: item.id, title: item.title })),
    [filteredLists]
  );

  const handleCreateList = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateList) return;
    if (!newListTitle.trim()) return;
    if (!boardId) return;
    const order = board?.lists ? board.lists.length + 1 : 1;
    dispatch(addListAction({ boardId, title: newListTitle, order }));
    setNewListTitle('');
    setIsAddingList(false);
  }, [board?.lists, boardId, canCreateList, dispatch, newListTitle]);

  const handleUpdateSelectedCard = useCallback((data: Partial<Card> & { label_ids?: number[] }) => {
    if (!selectedCard) return;
    const { label_ids, ...rest } = data;
    setSelectedCard(prev => (prev ? { ...prev, ...rest } : prev));
    dispatch(updateCardAction({ cardId: selectedCard.id, data }))
      .unwrap()
      .catch(() => {
        alert(t('common.actionFailed'));
        if (id) {
          dispatch(fetchBoardById(Number(id)));
        }
      });
  }, [dispatch, id, selectedCard, t]);

  const handleAddCard = useCallback((listId: number, title: string) => {
    const list = boardListsById.get(listId);
    if (!list || !canAddCardToList(list)) return;
    const order = (list?.cards?.length || 0) + 1;
    dispatch(addCardAction({ listId, title, order }));
  }, [boardListsById, canAddCardToList, dispatch]);

  const handleUpdateList = useCallback((listId: number, data: Partial<List>) => {
    dispatch(updateListOptimistic({ listId, data }));
    dispatch(updateListAction({ listId, data }));
  }, [dispatch]);

  const handleDeleteList = useCallback((listId: number) => {
    if (window.confirm(t('common.confirmDelete'))) {
      dispatch(deleteListAction(listId));
    }
  }, [dispatch, t]);

  const handleCopyList = useCallback((listId: number) => {
    dispatch(copyListAction({ listId }));
  }, [dispatch]);

  const handleArchiveAllCardsInList = useCallback((listId: number) => {
    const list = boardListsById.get(listId);
    if (!list) return;
    if (!window.confirm(t('list.archiveAllCardsConfirm'))) return;
    (list.cards || [])
      .filter((card: Card) => !card.is_archived)
      .forEach((card: Card) => {
        dispatch(updateCardAction({ cardId: card.id, data: { is_archived: true } }));
      });
  }, [boardListsById, dispatch, t]);

  const handleToggleCardComplete = useCallback((cardId: number, next: boolean) => {
    dispatch(updateCardAction({ cardId, data: { is_completed: next } }));
  }, [dispatch]);

  const handleTitleBlur = useCallback(() => {
    if (!boardId || !board) return;
    if (boardTitle !== board.title) {
        dispatch(updateBoardAction({ id: boardId, data: { title: boardTitle } }));
    }
  }, [board, boardId, boardTitle, dispatch]);

  const inviteLink = useMemo(
    () => (board?.invite_link ? `${window.location.origin}/invite/${board.invite_link}` : ''),
    [board?.invite_link]
  );

  const handleCopyInvite = useCallback(() => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
  }, [inviteLink]);

  const handleInvite = useCallback(async () => {
    if (!inviteLink) return;
    const shareApi = (navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share;
    if (shareApi) {
      try {
        await shareApi({ title: t('board.menu.inviteTitle'), url: inviteLink });
        return;
      } catch {
        // Fallback to copy if sharing is cancelled or unavailable.
      }
    }
    handleCopyInvite();
  }, [handleCopyInvite, inviteLink, t]);

  const stopAutoScroll = useCallback(() => {
    draggingTypeRef.current = null;
    if (autoScrollRafRef.current !== null) {
      window.cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const runAutoScroll = useCallback(() => {
    const draggingType = draggingTypeRef.current;
    if (!draggingType) {
      autoScrollRafRef.current = null;
      return;
    }

    const boardCanvas = boardCanvasRef.current;
    const pointer = dragPointerRef.current;

    if (boardCanvas) {
      const rect = boardCanvas.getBoundingClientRect();
      const horizontalDelta = getEdgeAutoScrollDelta(pointer.x, rect.left, rect.right, 92, 4, 28);
      if (horizontalDelta !== 0) {
        boardCanvas.scrollLeft += horizontalDelta;
      }
    }

    if (draggingType === 'card') {
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

  const startAutoScroll = useCallback((type: 'list' | 'card') => {
    draggingTypeRef.current = type;
    if (autoScrollRafRef.current !== null) return;
    autoScrollRafRef.current = window.requestAnimationFrame(runAutoScroll);
  }, [runAutoScroll]);

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

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  const onDragStart = useCallback((start: DragStart) => {
    closeTransientOverlays({ keepSidebar: true, keepFilter: true, keepActivity: true });
    startAutoScroll(start.type === 'list' ? 'list' : 'card');
  }, [closeTransientOverlays, startAutoScroll]);

  const onDragEnd = useCallback((result: DropResult) => {
    stopAutoScroll();
    const { destination, source, type, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'list') {
      if (!canEditBoard) return;
      dispatch(moveListOptimistic({ sourceIndex: source.index, destIndex: destination.index }));
      const listId = parseEntityId(draggableId, 'list-');
      if (!listId) return;
      dispatch(moveListAction({ listId, order: destination.index + 1 }));
      return;
    }

    const cardId = parseEntityId(draggableId, 'card-');
    const sourceListId = parseEntityId(source.droppableId, 'list-');
    const destListId = parseEntityId(destination.droppableId, 'list-');
    if (!cardId || !sourceListId || !destListId) return;
    const card = boardCards.find((c: Card) => c.id === cardId);
    const targetList = boardListsById.get(destListId);
    if (!card || !targetList) return;
    if (!canEditCard(card)) return;
    if (!canAddCardToList(targetList)) return;

    dispatch(moveCardOptimistic({
      cardId,
      sourceListId,
      destListId,
      newIndex: destination.index
    }));

    dispatch(moveCardAction({
      cardId,
      listId: destListId,
      order: destination.index + 1
    }));
  }, [boardCards, boardListsById, canAddCardToList, canEditBoard, canEditCard, dispatch, stopAutoScroll]);

  const handleMoveList = useCallback((listId: number, fromIndex: number, toIndex: number) => {
    if (!canEditBoard) return;
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= filteredLists.length) return;
    dispatch(moveListOptimistic({ sourceIndex: fromIndex, destIndex: toIndex }));
    dispatch(moveListAction({ listId, order: toIndex + 1 }));
  }, [canEditBoard, dispatch, filteredLists.length]);

  const handleMoveCard = useCallback((cardId: number, sourceListId: number, destListId: number, destIndex: number) => {
    if (!canEditBoard) {
      const card = boardCards.find((c: Card) => c.id === cardId);
      const targetList = boardListsById.get(destListId);
      if (!card || !targetList) return;
      if (!canEditCard(card)) return;
      if (!canAddCardToList(targetList)) return;
    }
    if (destIndex < 0) return;
    dispatch(moveCardOptimistic({ cardId, sourceListId, destListId, newIndex: destIndex }));
    dispatch(moveCardAction({ cardId, listId: destListId, order: destIndex + 1 }));
  }, [boardCards, boardListsById, canAddCardToList, canEditBoard, canEditCard, dispatch]);

  const runBoardAction = useCallback(async (action: any) => {
    try {
      return await dispatch(action).unwrap();
    } catch {
      alert(t('common.actionFailed'));
      return null;
    }
  }, [dispatch, t]);

  const handleUpdateCardLabels = useCallback((labelIds: number[]) => {
    if (!selectedCard) return;
    const nextLabels = (board?.labels || []).filter((label: NonNullable<Board['labels']>[number]) => labelIds.includes(label.id));
    setSelectedCard(prev => (prev ? { ...prev, labels: nextLabels } : prev));
    void runBoardAction(updateCardAction({ cardId: selectedCard.id, data: { label_ids: labelIds } }));
  }, [board?.labels, runBoardAction, selectedCard]);

  const toggleListCollapse = useCallback((listId: number) => {
    setCollapsedLists(prev => 
      prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]
    );
  }, []);

  const defaultBoardBackground = '/board-backgrounds/board-default.jpg';
  const backgroundValue = board?.background_url || defaultBoardBackground;
  const backgroundStyle = useMemo(() => {
    const isColorBackground = backgroundValue.startsWith('#');
    const isGradientBackground = backgroundValue.startsWith('linear-gradient') || backgroundValue.startsWith('radial-gradient');
    return {
      backgroundColor: isColorBackground ? backgroundValue : undefined,
      backgroundImage: !isColorBackground && backgroundValue ? (isGradientBackground ? backgroundValue : `url(${backgroundValue})`) : undefined,
      backgroundSize: !isColorBackground && backgroundValue && !isGradientBackground ? 'cover' : undefined,
      backgroundPosition: !isColorBackground && backgroundValue && !isGradientBackground ? 'center' : undefined,
      backgroundRepeat: !isColorBackground && backgroundValue && !isGradientBackground ? 'no-repeat' : undefined,
    } as React.CSSProperties;
  }, [backgroundValue]);
  const boardIconSrc = '/board-avatars/ava-anto-treklo.png';
  const boardIconLetter = board?.title?.trim()?.charAt(0).toUpperCase() || 'B';
  const fallbackAvatar = '/board-avatars/ava-anto-treklo.png';
  const getAvatarSrc = useCallback((profile?: { avatar_url?: string | null; avatar?: string | null }) => {
    const candidate = profile?.avatar_url || profile?.avatar || '';
    if (!candidate) return fallbackAvatar;
    if (candidate.startsWith('data:') || candidate.startsWith('http') || candidate.startsWith('/')) return candidate;
    return `/${candidate}`;
  }, [fallbackAvatar]);
  const getMemberDisplayName = useCallback((memberUser: BoardMember['user']) => {
    const fullName = `${memberUser.first_name || ''} ${memberUser.last_name || ''}`.trim();
    return fullName || memberUser.username || memberUser.email || t('nav.profile');
  }, [t]);
  const membersForDisplay = useMemo(() => {
    const list: Array<NonNullable<Board['owner']>> = [];
    const seen = new Set<number>();
    if (board?.owner) {
      list.push(board.owner);
      seen.add(board.owner.id);
    }
    (board?.members || []).forEach((member: BoardMember) => {
      if (!seen.has(member.user.id)) {
        list.push(member.user);
        seen.add(member.user.id);
      }
    });
    return list;
  }, [board?.members, board?.owner]);
  const headerMembers = useMemo(
    () =>
      membersForDisplay.map((userMember: BoardMember['user']) => ({
        user: userMember,
        membership: board?.members?.find((m: BoardMember) => m.user.id === userMember.id)
      })),
    [board?.members, membersForDisplay]
  );
  const visibleMembers = useMemo(() => membersForDisplay.slice(0, 4), [membersForDisplay]);
  const extraMembersCount = useMemo(
    () => Math.max(0, membersForDisplay.length - visibleMembers.length),
    [membersForDisplay.length, visibleMembers.length]
  );
  const normalizedMemberQuery = memberQuery.trim().toLowerCase();
  const filteredMembers = useMemo(
    () =>
      (board?.members || []).filter((member: BoardMember) => {
        if (!normalizedMemberQuery) return true;
        const displayName = getMemberDisplayName(member.user);
        const haystack = [displayName, member.user.username || '', member.user.email || '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedMemberQuery);
      }),
    [board?.members, getMemberDisplayName, normalizedMemberQuery]
  );

  const colorOptions = useMemo(
    () => [
      { key: 'default', value: '', label: t('board.background.default'), preview: `url(${defaultBoardBackground})` },
      { key: 'slate', value: '#1f2937', label: t('board.background.slate') },
      { key: 'charcoal', value: '#2c2c2c', label: t('board.background.charcoal') },
      { key: 'indigo', value: '#312e81', label: t('board.background.indigo') },
      { key: 'emerald', value: '#064e3b', label: t('board.background.emerald') },
      { key: 'warmLight', value: '#f5e7d0', label: t('board.background.warmLight') },
    ],
    [defaultBoardBackground, t]
  );

  const gradientOptions = useMemo(
    () => [
      { key: 'sunset', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', label: t('board.background.gradient.sunset') },
      { key: 'ocean', value: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)', label: t('board.background.gradient.ocean') },
      { key: 'forest', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', label: t('board.background.gradient.forest') },
      { key: 'blush', value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', label: t('board.background.gradient.blush') },
      { key: 'night', value: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)', label: t('board.background.gradient.night') },
      { key: 'dawn', value: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)', label: t('board.background.gradient.dawn') },
    ],
    [t]
  );
  const imageOptions = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => {
        const id = String(index + 1).padStart(2, '0');
        return {
          key: `photo-${id}`,
          value: `/board-backgrounds/board-${id}.jpg`,
          label: `${t('board.background.images')} ${id}`,
        };
      }),
    [t]
  );

  const handleBackgroundSelect = useCallback((value: string) => {
    if (!boardId) return;
    dispatch(updateBoardAction({ id: boardId, data: { background_url: value } }));
  }, [boardId, dispatch]);

  const handleBackgroundFile = useCallback((file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(t('board.background.invalidFile'));
      return;
    }
    const maxMb = 4;
    if (file.size > maxMb * 1024 * 1024) {
      alert(t('board.background.tooLarge', { size: String(maxMb) }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleBackgroundSelect(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, [handleBackgroundSelect, t]);

  const handleToggleMemberRole = useCallback((member: BoardMember, role: 'admin' | 'developer' | 'viewer') => {
    if (!canManageMembers) return;
    if (member.user.id === board?.owner?.id) return;
    dispatch(updateBoardMemberRoleAction({ membershipId: member.id, role }));
  }, [board?.owner?.id, canManageMembers, dispatch]);

  const handleLeaveBoard = useCallback(async () => {
    if (!currentMembership) return;
    await dispatch(removeBoardMemberAction(currentMembership.id));
    navigate('/boards');
  }, [currentMembership, dispatch, navigate]);

  const openMemberActivity = useCallback(async (member: BoardMember) => {
    if (!boardId) return;
    openActivity();
    setActivityMember(member);
    setIsActivityLoading(true);
    try {
      const logs = await getBoardActivity(boardId, member.user.id);
      setActivityLogs(logs as ActivityLog[]);
    } catch {
      setActivityLogs([]);
    } finally {
      setIsActivityLoading(false);
    }
  }, [boardId, openActivity]);

  const handleCardOpen = useCallback((card: Card) => {
    closeTransientOverlays();
    setSelectedCard(card);
  }, [closeTransientOverlays]);

  if (isLoading && !board) return <div className="loading-state">{t('common.loading')}</div>;
  if (error) return <div className="error-state">{t('board.error.loadDetails')}</div>;
  if (!board) return null;

  return (
    <div className={`board-detail-page ${isTouch ? 'is-touch' : ''}`} style={backgroundStyle}>
      <BoardHeader
        board={board}
        boardTitle={boardTitle}
        canEditBoard={canEditBoard}
        onBoardTitleChange={setBoardTitle}
        onBoardTitleBlur={handleTitleBlur}
        onToggleFavorite={() => dispatch(toggleFavoriteAction(board.id))}
        boardIconSrc={boardIconSrc}
        boardIconLetter={boardIconLetter}
        boardIconFailed={boardIconFailed}
        onBoardIconError={() => setBoardIconFailed(true)}
        isGlobalMenuOpen={isGlobalMenuOpen}
        onToggleGlobalMenu={toggleGlobalMenu}
        onCloseGlobalMenu={closeGlobalMenu}
        onLogout={() => dispatch(logoutUser())}
        headerMembers={headerMembers}
        visibleMembers={visibleMembers}
        extraMembersCount={extraMembersCount}
        headerMemberId={headerMemberId}
        onToggleHeaderMember={toggleHeaderMember}
        onCloseHeaderMember={closeHeaderMember}
        getAvatarSrc={getAvatarSrc}
        fallbackAvatar={fallbackAvatar}
        getMemberDisplayName={getMemberDisplayName}
        canManageMembers={canManageMembers}
        ownerId={board.owner?.id}
        currentUserId={user?.id}
        onOpenMemberActivity={openMemberActivity}
        onToggleMemberRole={handleToggleMemberRole}
        onRemoveMember={(membershipId) => dispatch(removeBoardMemberAction(membershipId))}
        filterQuery={filterQuery}
        onSearchChange={updateSearch}
        onOpenFilter={() => {
          openFilter();
        }}
        onOpenMenu={() => {
          openSidebar();
          setActiveMenuTab('main');
        }}
        onOpenMembersPanel={prepareHeaderMembersPanel}
        closeSignal={headerOverlayCloseSignal}
      />

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <Droppable droppableId="board-drop-zone" direction="horizontal" type="list">
          {(provided) => (
            <div
              className="board-canvas"
              ref={(node) => {
                boardCanvasRef.current = node;
                provided.innerRef(node);
              }}
              {...provided.droppableProps}
            >
              {filteredLists.map((list: List, index: number) => (
                <BoardColumn 
                  key={list.id} 
                  list={list} 
                  index={index} 
                  listIndex={index}
                  listOptions={listOptions}
                  prevList={index > 0 ? filteredLists[index - 1] : null}
                  nextList={index < filteredLists.length - 1 ? filteredLists[index + 1] : null}
                  isTouch={isTouch}
                  canEditList={canEditBoard}
                  canAddCards={canAddCardToList(list)}
                  canEditCard={canEditCard}
                  onAddCard={handleAddCard}
                  onUpdateList={handleUpdateList}
                  onDeleteList={handleDeleteList}
                  onCopyList={handleCopyList}
                  onArchiveAllCards={handleArchiveAllCardsInList}
                  onCardClick={handleCardOpen}
                  onToggleCardComplete={handleToggleCardComplete}
                  listMenuOpen={openListMenuId !== null && openListMenuId === list.id}
                  onToggleListMenu={toggleListMenu}
                  onCloseListMenu={closeListMenu}
                  isCollapsed={collapsedLists.includes(list.id)}
                  onToggleCollapse={toggleListCollapse}
                  onMoveList={handleMoveList}
                  onMoveCard={handleMoveCard}
                />
              ))}
              {provided.placeholder}

              {canCreateList && (
                <div className="add-list-wrapper">
                  {isAddingList ? (
                    <form onSubmit={handleCreateList}>
                      <input name="listTitle" className="form-input" autoFocus placeholder={t('list.create.placeholder')} value={newListTitle} onChange={e => setNewListTitle(e.target.value)} style={{ marginBottom: 8, background: 'var(--bg-input)' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button type="submit" size="sm" variant="primary">{t('list.create.submit')}</Button>
                        <button type="button" onClick={() => setIsAddingList(false)} className="btn-secondary btn-sm" style={{ width: 'auto', background: 'transparent', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }} aria-label={t('common.close')}>✕</button>
                      </div>
                    </form>
                  ) : (
                    <button className="btn-add-list" onClick={() => setIsAddingList(true)}>{t('list.addButton')}</button>
                  )}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {selectedCard && (
          <CardModal 
             card={selectedCard}
             board={board}
             isOpen={!!selectedCard}
             onClose={() => setSelectedCard(null)}
             onCopyLink={async () => {
               const url = `${window.location.origin}/boards/${board.id}?card=${selectedCard.id}`;
               try {
                 await navigator.clipboard.writeText(url);
               } catch {
                 window.prompt(t('card.menu.copyLinkPrompt'), url);
               }
             }}
             onUpdateCard={handleUpdateSelectedCard}
             onDeleteCard={() => { void runBoardAction(deleteCardAction(selectedCard.id)); }}
             onCopyCard={() => { void runBoardAction(copyCardAction({ cardId: selectedCard.id, listId: selectedCard.list })); }}
             onMoveCard={handleMoveCard}
             onAddChecklist={(title) => runBoardAction(addChecklistAction({ cardId: selectedCard.id, title }))}
             onDeleteChecklist={(checklistId) => runBoardAction(deleteChecklistAction({ checklistId, cardId: selectedCard.id }))}
             onAddChecklistItem={(checklistId, text) => runBoardAction(addChecklistItemAction({ checklistId, text }))}
             onDeleteChecklistItem={(itemId, checklistId) => runBoardAction(deleteChecklistItemAction({ itemId, checklistId }))}
             onToggleChecklistItem={(itemId, is_checked) => runBoardAction(updateChecklistItemAction({ itemId, data: { is_checked } }))}
             onUpdateChecklistItem={(itemId, text) => runBoardAction(updateChecklistItemAction({ itemId, data: { text } }))}
             onAddComment={(text) => { void runBoardAction(addCommentAction({ cardId: selectedCard.id, text })); }}
             onUpdateComment={(commentId, text) => { void runBoardAction(updateCommentAction({ commentId, text })); }}
             onDeleteComment={(commentId) => { void runBoardAction(deleteCommentAction({ commentId })); }}
             onUpdateLabels={handleUpdateCardLabels}
             onCreateLabel={async (name, color) => {
               const created = await runBoardAction(createLabelAction({ boardId: board.id, name, color }));
               if (!created?.id) return created;
               const currentIds = (selectedCard.labels || []).map(label => label.id);
               if (!currentIds.includes(created.id)) {
                 await runBoardAction(updateCardAction({
                   cardId: selectedCard.id,
                   data: { label_ids: [...currentIds, created.id] }
                 }));
               }
               return created;
             }}
             onUpdateLabel={(id, name, color) => { void runBoardAction(updateLabelAction({ id, data: { name, color } })); }}
             onDeleteLabel={(id) => {
               setSelectedCard(prev => (prev ? { ...prev, labels: (prev.labels || []).filter(label => label.id !== id) } : prev));
               void runBoardAction(deleteLabelAction(id));
             }}
              onJoinCard={() => { void runBoardAction(joinCardAction(selectedCard.id)); }}
              onLeaveCard={() => { void runBoardAction(leaveCardAction(selectedCard.id)); }}
              onRemoveMember={(userId) => { void runBoardAction(removeCardMemberAction({ cardId: selectedCard.id, userId })); }}
              onAddMember={(userId) => { void runBoardAction(addCardMemberAction({ cardId: selectedCard.id, userId })); }}
              onAddAttachment={(file) => runBoardAction(addAttachmentAction({ cardId: selectedCard.id, file }))}
              onDeleteAttachment={(attachmentId) => { void runBoardAction(deleteAttachmentAction({ cardId: selectedCard.id, attachmentId })); }}
            />
      )}

      <BoardFiltersModal
        isOpen={isFilterOpen}
        onClose={closeFilter}
        filterQuery={filterQuery}
        onSearchChange={updateSearch}
        filterMemberId={filterMemberId}
        onMemberChange={setFilterMemberId}
        filterLabelId={filterLabelId}
        onLabelChange={setFilterLabelId}
        filterDue={filterDue}
        onDueChange={setFilterDue}
        filterCompleted={filterCompleted}
        onCompletedChange={setFilterCompleted}
        members={board.members || []}
        labels={board.labels || []}
        onReset={() => {
          setFilterMemberId('');
          setFilterLabelId('');
          setFilterDue('all');
          setFilterCompleted('all');
        }}
      />

      <BoardMenuSidebar
        isOpen={isMenuOpen}
        onClose={closeSidebar}
        activeTab={activeMenuTab}
        onTabChange={setActiveMenuTab}
        board={board}
        inviteLink={inviteLink}
        onInvite={handleInvite}
        canEditBoard={canEditBoard}
        canManageMembers={canManageMembers}
        canLeaveBoard={canLeaveBoard}
        isOwner={isOwner}
        onArchiveToggle={() => dispatch(updateBoardAction({ id: board.id, data: { is_archived: !board.is_archived } }))}
        onDeleteBoard={async () => {
          if (window.confirm(t('board.deleteConfirm'))) {
            await dispatch(deleteBoardAction(board.id));
            navigate('/boards');
          }
        }}
        onLeaveBoard={handleLeaveBoard}
        onLogout={() => dispatch(logoutUser())}
        onUpdateBoardSettings={(data) => dispatch(updateBoardAction({ id: board.id, data }))}
        colorOptions={colorOptions}
        gradientOptions={gradientOptions}
        imageOptions={imageOptions}
        bgUrlInput={bgUrlInput}
        onBgUrlInputChange={setBgUrlInput}
        onBackgroundSelect={handleBackgroundSelect}
        onBackgroundFile={handleBackgroundFile}
        memberQuery={memberQuery}
        onMemberQueryChange={setMemberQuery}
        filteredMembers={filteredMembers}
        activeMemberId={activeMemberId}
        onToggleActiveMember={setActiveMemberId}
        getMemberDisplayName={getMemberDisplayName}
        getAvatarSrc={getAvatarSrc}
        fallbackAvatar={fallbackAvatar}
        onOpenMemberActivity={openMemberActivity}
        onToggleMemberRole={handleToggleMemberRole}
        onRemoveMember={(membershipId) => dispatch(removeBoardMemberAction(membershipId))}
        currentUserId={user?.id}
        archivedLists={archivedLists}
        archivedCards={archivedCards}
        onUnarchiveList={(listId) => dispatch(updateListAction({ listId, data: { is_archived: false } }))}
        onDeleteList={(listId) => dispatch(deleteListAction(listId))}
        onUnarchiveCard={(cardId) => dispatch(updateCardAction({ cardId, data: { is_archived: false } }))}
        onDeleteCard={(cardId) => dispatch(deleteCardAction(cardId))}
      />

      <Link to="/help" className="board-floating-help" aria-label={t('nav.help')} title={t('nav.help')}>
        ?
      </Link>

      <BoardActivityModal
        isOpen={isActivityOpen}
        onClose={() => {
          closeActivity();
          setActivityMember(null);
        }}
        activityMember={activityMember}
        activityLogs={activityLogs}
        isLoading={isActivityLoading}
      />
    </div>
  );
};
