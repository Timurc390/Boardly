import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface Board {
  id: number;
  title: string;
  description?: string;
  background_url?: string;
  is_archived?: boolean;
}

interface List {
  id: number;
  title: string;
  board: number;
  order: number;
  is_archived?: boolean;
}

interface Label {
  id: number;
  name: string;
  color: string;
}

interface ChecklistItem {
  id: number;
  text: string;
  is_checked: boolean;
  order: number;
}

interface Checklist {
  id: number;
  title: string;
  items: ChecklistItem[];
}

interface Card {
  id: number;
  title: string;
  description?: string;
  list: number;
  order?: number;
  due_date?: string | null;
  is_archived?: boolean;
  labels?: Label[];
  checklists?: Checklist[];
}

type DragStartEvent =
  | React.DragEvent<HTMLElement>
  | React.MouseEvent<HTMLElement>
  | React.TouchEvent<HTMLElement>
  | React.PointerEvent<HTMLElement>
  | DragEvent
  | MouseEvent
  | TouchEvent
  | PointerEvent;

const BACKGROUND_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Slate', value: '#0f172a' },
  { label: 'Charcoal', value: '#1f1f1f' },
  { label: 'Indigo', value: '#1e1b4b' },
  { label: 'Emerald', value: '#064e3b' },
  { label: 'Warm Light', value: '#fff4e6' },
];

interface LegacyBoardScreenProps {
  activeBoard?: { id: number; title: string; background_url?: string } | null;
  boards?: any[];
}

export const LegacyBoardScreen: React.FC<LegacyBoardScreenProps> = ({ activeBoard: propActiveBoard, boards: propBoards }) => {
  const { authToken, user, logout, isAuthenticated, boardCache, setBoardCache, cardsCache, setCardsCacheForBoard } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);

  const isDragEvent = (event: DragStartEvent): event is React.DragEvent<HTMLElement> | DragEvent => (
    'dataTransfer' in event
  );

  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [cardDraft, setCardDraft] = useState<Card | null>(null);
  const [checklistDrafts, setChecklistDrafts] = useState<Record<number, Checklist[]>>({});
  const [labelDrafts, setLabelDrafts] = useState<Record<number, number[]>>({});
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistItemText, setNewChecklistItemText] = useState<Record<number, string>>({});
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#2563eb');
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [shareStatus, setShareStatus] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [showMobileNav, setShowMobileNav] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingToListId, setAddingToListId] = useState<number | null>(null);

  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardBackground, setNewBoardBackground] = useState('');
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editListTitle, setEditListTitle] = useState('');

  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [editBoardBackground, setEditBoardBackground] = useState('');

  const [showArchivedCards, setShowArchivedCards] = useState(false);
  const [showArchivedLists, setShowArchivedLists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [openListMenuId, setOpenListMenuId] = useState<number | null>(null);
  const [openCardMenuId, setOpenCardMenuId] = useState<number | null>(null);
  const [highlightCardId, setHighlightCardId] = useState<number | null>(null);
  const [pendingListHighlightId, setPendingListHighlightId] = useState<number | null>(null);
  const [pendingCardHighlightId, setPendingCardHighlightId] = useState<number | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [draggingListId, setDraggingListId] = useState<number | null>(null);
  const [dragOverListId, setDragOverListId] = useState<number | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<number | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<number | null>(null);

  const listRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const closeMobileNav = () => {
    setShowMobileNav(false);
  };

  const handleRouteNavigate = (path: string) => {
    setShowMobileNav(false);
    navigate(path);
  };

  useEffect(() => {
    setBoardCache(boards);
  }, [boards, setBoardCache]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.list-menu') || target.closest('.card-menu') || target.closest('.command-modal')) {
        return;
      }
      setOpenListMenuId(null);
      setOpenCardMenuId(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (activeBoard) {
      setCardsCacheForBoard(activeBoard.id, cards);
    }
  }, [activeBoard?.id, cards, setCardsCacheForBoard]);

  const boardBackgroundStyle = useMemo(() => {
    if (!activeBoard?.background_url) {
      return {};
    }
    const value = activeBoard.background_url.trim();
    if (value.startsWith('#') || value.startsWith('rgb')) {
      return { backgroundColor: value };
    }
    return { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }, [activeBoard?.background_url]);

  const highlightElement = (element: HTMLElement | null, className: string) => {
    if (!element) return;
    element.classList.add(className);
    setTimeout(() => element.classList.remove(className), 1600);
  };

  const cloneChecklists = (source?: Checklist[]) => (
    (source || []).map(checklist => ({
      ...checklist,
      items: (checklist.items || []).map(item => ({ ...item }))
    }))
  );

  const getCardLabelIds = (card: Card) => (
    labelDrafts[card.id] ?? (card.labels || []).map((label: Label) => label.id)
  );

  const getCardChecklists = (card: Card) => (
    checklistDrafts[card.id] ?? cloneChecklists(card.checklists)
  );

  const toDateInputValue = (value?: string | null) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (value.includes('T')) {
      return value.split('T')[0];
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  };

  const toApiDueDate = (value: string) => (value ? value : null);
  const sortCardsByOrder = (a: Card, b: Card) => {
    const orderDiff = Number(a.order ?? 0) - Number(b.order ?? 0);
    return orderDiff !== 0 ? orderDiff : a.id - b.id;
  };
  const getListCardGroups = (listId: number) => {
    const listCards = cards.filter(card => card.list === listId);
    const activeCards = listCards.filter(card => !card.is_archived).sort(sortCardsByOrder);
    const archivedCards = listCards.filter(card => card.is_archived).sort(sortCardsByOrder);
    return { activeCards, archivedCards };
  };
  const getActiveListCards = (listId: number) => getListCardGroups(listId).activeCards;
  const normalizeCardOrders = (listCards: Card[]) => (
    listCards.map((card, index) => ({ ...card, order: index + 1 }))
  );

  useEffect(() => {
    if (activeBoard?.id) {
      localStorage.setItem('lastBoardId', String(activeBoard.id));
    }
  }, [activeBoard?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const loadBoards = async (force = false) => {
    if (!force && boardCache && boardCache.length > 0) {
      setBoards(boardCache as Board[]);
      return boardCache as Board[];
    }
    const res = await axios.get(`${API_URL}/boards/`, { headers: { Authorization: `Token ${authToken}` } });
    setBoards(res.data);
    setBoardCache(res.data);
    return res.data as Board[];
  };

  const reloadBoardData = async (boardId?: number) => {
    if (!authToken) return;
    setIsReloading(true);
    setIsBoardLoading(true);
    try {
      const nextBoards = await loadBoards(true);
      const storedId = Number(localStorage.getItem('lastBoardId'));
      const preferredId = Number.isFinite(storedId) ? storedId : undefined;
      const nextBoardId = boardId ?? activeBoard?.id ?? preferredId ?? nextBoards[0]?.id;
      const nextBoard = nextBoards.find(board => board.id === nextBoardId) || nextBoards[0] || null;
      if (!nextBoard) return;

      setActiveBoard(nextBoard);
      setEditBoardTitle(nextBoard.title);
      setEditBoardBackground(nextBoard.background_url || '');

      const [listsRes, cardsRes] = await Promise.all([
        axios.get(`${API_URL}/lists/?board_id=${nextBoard.id}`, { headers: { Authorization: `Token ${authToken}` } }),
        axios.get(`${API_URL}/cards/?board_id=${nextBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
      ]);
      setLists(listsRes.data.sort((a: List, b: List) => a.order - b.order));
      setCards(cardsRes.data);
      setCardsCacheForBoard(nextBoard.id, cardsRes.data);
    } catch (err: any) {
      setError(`Помилка оновлення дошки: ${err.message || 'невідомо'}`);
    } finally {
      setIsReloading(false);
      setIsBoardLoading(false);
    }
  };

  const reloadCardsOnly = async (boardId: number) => {
    if (!authToken) return;
    try {
      const res = await axios.get(`${API_URL}/cards/?board_id=${boardId}`, { headers: { Authorization: `Token ${authToken}` } });
      setCards(res.data);
      setCardsCacheForBoard(boardId, res.data);
    } catch {
      setToast('Не вдалося оновити картки.');
    }
  };

  // Initialize from props or load on first render
  useEffect(() => {
    if (propActiveBoard && !activeBoard) {
      console.log('[LegacyBoardScreen] Using active board from props:', propActiveBoard.id);
      setActiveBoard(propActiveBoard);
      setEditBoardTitle(propActiveBoard.title);
      setEditBoardBackground(propActiveBoard.background_url || '');
    }
    if (propBoards && propBoards.length > 0 && boards.length === 0) {
      console.log('[LegacyBoardScreen] Using boards from props:', propBoards.length);
      setBoards(propBoards);
    }
  }, [propActiveBoard, propBoards]);

  useEffect(() => {
    if (!authToken || !activeBoard) return;

    let isActive = true;
    setIsBoardLoading(true);

    const listPromise = axios.get(`${API_URL}/lists/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
      .then(res => {
        if (!isActive) return;
        setLists(res.data.sort((a: List, b: List) => a.order - b.order));
      })
      .catch((err: any) => {
        if (!isActive) return;
        setError(`Помилка списків: ${err.message}`);
      });

    const cachedCards = cardsCache[activeBoard.id];
    const cardsPromise = cachedCards
      ? Promise.resolve().then(() => {
          if (!isActive) return;
          setCards(cachedCards as Card[]);
        })
      : axios.get(`${API_URL}/cards/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
        .then(res => {
          if (!isActive) return;
          setCards(res.data);
          setCardsCacheForBoard(activeBoard.id, res.data);
        })
        .catch((err: any) => {
          if (!isActive) return;
          setError(`Помилка карток: ${err.message}`);
        });

    Promise.all([listPromise, cardsPromise]).finally(() => {
      if (!isActive) return;
      setIsBoardLoading(false);
    });

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, activeBoard?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const boardId = Number(params.get('board'));
    if (!boardId || !boards.length) return;
    if (activeBoard?.id === boardId) return;
    reloadBoardData(boardId);
  }, [boards, activeBoard?.id, location.search]);

  useEffect(() => {
    if (!activeListId && lists.length > 0) {
      setActiveListId(lists[0].id);
    }
  }, [activeListId, lists]);

  useEffect(() => {
    if (!pendingListHighlightId) return;
    const element = listRefs.current[pendingListHighlightId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      highlightElement(element, 'list-highlight');
    }
    setPendingListHighlightId(null);
  }, [pendingListHighlightId, lists.length]);

  useEffect(() => {
    if (!pendingCardHighlightId) return;
    const element = cardRefs.current[pendingCardHighlightId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setHighlightCardId(pendingCardHighlightId);
    const timer = setTimeout(() => setHighlightCardId(null), 1600);
    setPendingCardHighlightId(null);
    return () => clearTimeout(timer);
  }, [pendingCardHighlightId]);

  useEffect(() => {
    if (!authToken || !activeBoard) return;
    axios.get(`${API_URL}/labels/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
      .then(res => setBoardLabels(res.data))
      .catch(() => setBoardLabels([]));
  }, [authToken, activeBoard?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cardId = Number(params.get('card'));
    if (!cardId || selectedCardId) return;
    const card = cards.find(c => c.id === cardId);
    if (card) {
      setSelectedCardId(card.id);
      setCardDraft({ ...card });
      setChecklistDrafts(prev => (
        prev[card.id] ? prev : { ...prev, [card.id]: cloneChecklists(card.checklists) }
      ));
      setLabelDrafts(prev => (
        prev[card.id] ? prev : { ...prev, [card.id]: (card.labels || []).map((label: Label) => label.id) }
      ));
    }
  }, [cards, location.search, selectedCardId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return;
      if (target?.isContentEditable) return;

      if (event.key === 'Escape' && commandOpen) {
        setCommandOpen(false);
        return;
      }

      if (event.key === 'Escape' && selectedCardId) {
        closeCardDetails();
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandQuery('');
        setCommandOpen(true);
        return;
      }

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        const fallbackList = lists.find(list => showArchivedLists || !list.is_archived);
        const nextListId = activeListId ?? fallbackList?.id;
        if (!nextListId) return;
        setActiveListId(nextListId);
        setAddingToListId(nextListId);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeListId, commandOpen, lists, selectedCardId, showArchivedLists]);

  const getNextTempId = () => -Math.floor(Date.now() + Math.random() * 1000);

  const openCardDetails = (card: Card) => {
    setSelectedCardId(card.id);
    setCardDraft({ ...card });
    setDueDateInput(toDateInputValue(card.due_date));
    setShareStatus('');
    setChecklistDrafts(prev => (
      prev[card.id] ? prev : { ...prev, [card.id]: cloneChecklists(card.checklists) }
    ));
    setLabelDrafts(prev => (
      prev[card.id] ? prev : { ...prev, [card.id]: (card.labels || []).map((label: Label) => label.id) }
    ));
  };

  const closeCardDetails = () => {
    setSelectedCardId(null);
    setCardDraft(null);
    setShareStatus('');
    const params = new URLSearchParams(location.search);
    if (params.has('card')) {
      params.delete('card');
      const search = params.toString();
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
    }
  };

  const updateChecklistDraft = (cardId: number, updater: (current: Checklist[]) => Checklist[]) => {
    setChecklistDrafts(prev => ({
      ...prev,
      [cardId]: updater(prev[cardId] || [])
    }));
  };

  const handleToggleChecklistItem = async (cardId: number, checklistId: number, itemId: number) => {
    let nextValue = false;
    updateChecklistDraft(cardId, (checklists) => (
      checklists.map(checklist => {
        if (checklist.id !== checklistId) return checklist;
        return {
          ...checklist,
          items: checklist.items.map(item => {
            if (item.id !== itemId) return item;
            nextValue = !item.is_checked;
            return { ...item, is_checked: nextValue };
          })
        };
      })
    ));

    if (!authToken || itemId < 0) return;
    try {
      await axios.patch(
        `${API_URL}/checklist-items/${itemId}/`,
        { is_checked: nextValue },
        { headers: { Authorization: `Token ${authToken}` } }
      );
    } catch {
      updateChecklistDraft(cardId, (checklists) => (
        checklists.map(checklist => {
          if (checklist.id !== checklistId) return checklist;
          return {
            ...checklist,
            items: checklist.items.map(item => (
              item.id === itemId ? { ...item, is_checked: !nextValue } : item
            ))
          };
        })
      ));
    }
  };

  const handleAddChecklist = async () => {
    if (!cardDraft || !newChecklistTitle.trim()) return;
    const tempId = getNextTempId();
    const title = newChecklistTitle.trim();
    updateChecklistDraft(cardDraft.id, (checklists) => [...checklists, { id: tempId, title, items: [] }]);
    setNewChecklistTitle('');

    if (!authToken) return;
    try {
      const res = await axios.post(
        `${API_URL}/checklists/`,
        { card: cardDraft.id, title },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      updateChecklistDraft(cardDraft.id, (checklists) => (
        checklists.map(checklist => checklist.id === tempId ? { ...checklist, id: res.data.id } : checklist)
      ));
    } catch {
      setToast('Не вдалося зберегти чеклист.');
      updateChecklistDraft(cardDraft.id, (checklists) => checklists.filter(checklist => checklist.id !== tempId));
    }
  };

  const handleRemoveChecklist = async (cardId: number, checklistId: number) => {
    updateChecklistDraft(cardId, (checklists) => checklists.filter(checklist => checklist.id !== checklistId));
    if (!authToken || checklistId < 0) return;
    try {
      await axios.delete(`${API_URL}/checklists/${checklistId}/`, { headers: { Authorization: `Token ${authToken}` } });
    } catch {
      setToast('Не вдалося видалити чеклист.');
    }
  };

  const handleAddChecklistItem = async (cardId: number, checklistId: number) => {
    const text = newChecklistItemText[checklistId]?.trim();
    if (!text) return;
    const tempId = getNextTempId();
    updateChecklistDraft(cardId, (checklists) => (
      checklists.map(checklist => {
        if (checklist.id !== checklistId) return checklist;
        const nextItem: ChecklistItem = {
          id: tempId,
          text,
          is_checked: false,
          order: checklist.items.length
        };
        return { ...checklist, items: [...checklist.items, nextItem] };
      })
    ));
    setNewChecklistItemText(prev => ({ ...prev, [checklistId]: '' }));

    if (!authToken || checklistId < 0) return;
    try {
      const res = await axios.post(
        `${API_URL}/checklist-items/`,
        { checklist: checklistId, text, is_checked: false, order: 0 },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      updateChecklistDraft(cardId, (checklists) => (
        checklists.map(checklist => {
          if (checklist.id !== checklistId) return checklist;
          return {
            ...checklist,
            items: checklist.items.map(item => item.id === tempId ? { ...item, id: res.data.id } : item)
          };
        })
      ));
    } catch {
      updateChecklistDraft(cardId, (checklists) => (
        checklists.map(checklist => {
          if (checklist.id !== checklistId) return checklist;
          return { ...checklist, items: checklist.items.filter(item => item.id !== tempId) };
        })
      ));
      setToast('Не вдалося додати пункт чеклисту.');
    }
  };

  const handleRemoveChecklistItem = async (cardId: number, checklistId: number, itemId: number) => {
    let removedItem: ChecklistItem | null = null;
    updateChecklistDraft(cardId, (checklists) => (
      checklists.map(checklist => {
        if (checklist.id !== checklistId) return checklist;
        const nextItems = checklist.items.filter(item => {
          if (item.id === itemId) removedItem = item;
          return item.id !== itemId;
        });
        return { ...checklist, items: nextItems };
      })
    ));

    if (!authToken || itemId < 0) return;
    try {
      await axios.delete(`${API_URL}/checklist-items/${itemId}/`, { headers: { Authorization: `Token ${authToken}` } });
    } catch {
      if (!removedItem) return;
      updateChecklistDraft(cardId, (checklists) => (
        checklists.map(checklist => (
          checklist.id === checklistId
            ? { ...checklist, items: [...checklist.items, removedItem!] }
            : checklist
        ))
      ));
    }
  };

  const handleToggleLabel = (cardId: number, labelId: number) => {
    setLabelDrafts(prev => {
      const current = new Set(prev[cardId] || []);
      if (current.has(labelId)) current.delete(labelId);
      else current.add(labelId);
      return { ...prev, [cardId]: Array.from(current) };
    });
  };

  const handleAddLabel = async () => {
    if (!cardDraft || !newLabelName.trim() || !authToken || !activeBoard) return;
    try {
      const res = await axios.post(
        `${API_URL}/labels/`,
        { board: activeBoard.id, name: newLabelName.trim(), color: newLabelColor },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setBoardLabels(prev => [...prev, res.data]);
      setLabelDrafts(prev => ({
        ...prev,
        [cardDraft.id]: [...(prev[cardDraft.id] || []), res.data.id]
      }));
      setNewLabelName('');
    } catch {
      setToast('Не вдалося створити мітку.');
    }
  };

  const handleSaveCardDetails = async () => {
    if (!cardDraft || !authToken) return;
    try {
      const res = await axios.patch(
        `${API_URL}/cards/${cardDraft.id}/`,
        {
          description: cardDraft.description || '',
          due_date: toApiDueDate(dueDateInput),
          label_ids: getCardLabelIds(cardDraft)
        },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setCards(cards.map(c => c.id === cardDraft.id ? res.data : c));
      setCardDraft(res.data);
    } catch {
      setToast('Не вдалося зберегти картку.');
    }
  };

  const handleShareCard = async (card: Card) => {
    if (!activeBoard) return;
    const link = `${window.location.origin}/board?board=${activeBoard.id}&card=${card.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setShareStatus('Посилання скопійовано');
      setToast('Посилання скопійовано');
    } catch {
      window.prompt('Скопіюйте посилання:', link);
    }
  };

  const handleCopyCard = async (card: Card) => {
    if (!authToken) return;
    const listCards = cards.filter(c => c.list === card.list);
    const maxOrder = listCards.reduce((acc, c) => Math.max(acc, Number(c.order ?? 0)), 0);
    const dueDateValue = card.due_date ? toApiDueDate(toDateInputValue(card.due_date)) : null;
    try {
      const res = await axios.post(
        `${API_URL}/cards/`,
        {
          title: `${card.title} (копія)`,
          description: card.description || '',
          list: card.list,
          order: maxOrder + 1,
          due_date: dueDateValue,
          label_ids: (card.labels || []).map((label: Label) => label.id)
        },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      const newCard = res.data as Card;
      setCards([...cards, newCard]);

      if (card.checklists && card.checklists.length > 0) {
        for (const checklist of card.checklists) {
          const checklistRes = await axios.post(
            `${API_URL}/checklists/`,
            { card: newCard.id, title: checklist.title },
            { headers: { Authorization: `Token ${authToken}` } }
          );
          const newChecklistId = checklistRes.data.id;
          for (const item of checklist.items || []) {
            await axios.post(
              `${API_URL}/checklist-items/`,
              { checklist: newChecklistId, text: item.text, is_checked: item.is_checked, order: item.order ?? 0 },
              { headers: { Authorization: `Token ${authToken}` } }
            );
          }
        }
      }
      setToast('Картку скопійовано');
    } catch {
      setToast('Не вдалося скопіювати картку.');
    }
  };

  const handleCopyList = async (list: List) => {
    if (!authToken || !activeBoard) return;
    const maxOrder = lists.reduce((acc, l) => Math.max(acc, Number(l.order ?? 0)), 0);
    try {
      const res = await axios.post(
        `${API_URL}/lists/`,
        { title: `${list.title} (копія)`, board: activeBoard.id, order: maxOrder + 1 },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      const newList = res.data as List;
      setLists(prev => [...prev, newList].sort((a, b) => Number(a.order) - Number(b.order)));

      const sourceCards = cards.filter(card => card.list === list.id);
      if (sourceCards.length > 0) {
        const createdCards: Card[] = [];
        for (let index = 0; index < sourceCards.length; index += 1) {
          const card = sourceCards[index];
          const cardRes = await axios.post(
            `${API_URL}/cards/`,
            {
              title: card.title,
              description: card.description || '',
              list: newList.id,
              order: Number(card.order ?? index),
              due_date: card.due_date ? toApiDueDate(toDateInputValue(card.due_date)) : null,
              label_ids: (card.labels || []).map((label: Label) => label.id)
            },
            { headers: { Authorization: `Token ${authToken}` } }
          );
          const newCard = cardRes.data as Card;
          createdCards.push(newCard);

          if (card.checklists && card.checklists.length > 0) {
            for (const checklist of card.checklists) {
              const checklistRes = await axios.post(
                `${API_URL}/checklists/`,
                { card: newCard.id, title: checklist.title },
                { headers: { Authorization: `Token ${authToken}` } }
              );
              const newChecklistId = checklistRes.data.id;
              for (const item of checklist.items || []) {
                await axios.post(
                  `${API_URL}/checklist-items/`,
                  { checklist: newChecklistId, text: item.text, is_checked: item.is_checked, order: item.order ?? 0 },
                  { headers: { Authorization: `Token ${authToken}` } }
                );
              }
            }
          }
        }
        setCards(prev => [...prev, ...createdCards]);
      }
      setToast('Список скопійовано');
    } catch {
      setToast('Не вдалося скопіювати список.');
    }
  };

  const handleMoveList = async (listId: number, direction: -1 | 1) => {
    const sorted = [...lists].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
    const currentIndex = sorted.findIndex(list => list.id === listId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[currentIndex];
    const target = sorted[targetIndex];
    const nextLists = lists.map(list => {
      if (list.id === current.id) return { ...list, order: target.order };
      if (list.id === target.id) return { ...list, order: current.order };
      return list;
    });
    setLists(nextLists.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)));

    if (!authToken) return;
    try {
      await Promise.all([
        axios.patch(`${API_URL}/lists/${current.id}/`, { order: target.order }, { headers: { Authorization: `Token ${authToken}` } }),
        axios.patch(`${API_URL}/lists/${target.id}/`, { order: current.order }, { headers: { Authorization: `Token ${authToken}` } })
      ]);
    } catch {
      setLists(sorted);
      setToast('Не вдалося перемістити список.');
    }
  };

  const handleAddTask = async (e: FormEvent, listId: number) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !authToken) return;
    try {
      setActiveListId(listId);
      const maxOrder = cards
        .filter(card => card.list === listId)
        .reduce((acc, card) => Math.max(acc, Number(card.order ?? 0)), 0);
      const res = await axios.post(
        `${API_URL}/cards/`,
        { title: newTaskTitle, list: listId, order: maxOrder + 1 },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setCards([...cards, res.data]);
      setNewTaskTitle('');
      setAddingToListId(null);
    } catch {
      setToast('Не вдалося створити задачу.');
    }
  };

  const moveCardToPosition = async (cardId: number, targetListId: number, targetIndex: number) => {
    const previousCards = cards;
    const movingCard = previousCards.find(card => card.id === cardId);
    if (!movingCard || movingCard.is_archived) return;

    const sourceListId = movingCard.list;
    const sourceGroups = getListCardGroups(sourceListId);
    const targetGroups = sourceListId === targetListId ? sourceGroups : getListCardGroups(targetListId);
    const nextSourceActive = sourceGroups.activeCards.filter(card => card.id !== cardId);
    const nextTargetActive = targetGroups.activeCards.filter(card => card.id !== cardId);
    const clampedIndex = Math.max(0, Math.min(targetIndex, nextTargetActive.length));
    const updatedCard = { ...movingCard, list: targetListId };

    nextTargetActive.splice(clampedIndex, 0, updatedCard);

    const updatedSourceCombined = normalizeCardOrders([...nextSourceActive, ...sourceGroups.archivedCards]);
    const updatedTargetCombined = normalizeCardOrders([...nextTargetActive, ...targetGroups.archivedCards]);
    const remainingCards = previousCards.filter(card => (
      card.list !== sourceListId && card.list !== targetListId
    ));
    const nextCards = sourceListId === targetListId
      ? [...remainingCards, ...updatedTargetCombined]
      : [...remainingCards, ...updatedSourceCombined, ...updatedTargetCombined];

    setCards(nextCards);

    if (!authToken) return;

    const updatedLists = sourceListId === targetListId
      ? updatedTargetCombined
      : [...updatedSourceCombined, ...updatedTargetCombined];
    const changed = updatedLists.filter(update => {
      const prev = previousCards.find(card => card.id === update.id);
      return prev?.list !== update.list || Number(prev?.order ?? 0) !== Number(update.order ?? 0);
    });

    if (changed.length === 0) return;

    try {
      await Promise.all(
        changed.map(update => (
          axios.patch(
            `${API_URL}/cards/${update.id}/`,
            { list: update.list, order: update.order },
            { headers: { Authorization: `Token ${authToken}` } }
          )
        ))
      );
    } catch {
      setCards(previousCards);
      setToast('Не вдалося перемістити картку.');
      if (activeBoard) {
        reloadCardsOnly(activeBoard.id);
      }
    }
  };

  const handleMoveCard = async (card: Card, targetListId: number) => {
    try {
      const targetCards = getActiveListCards(targetListId);
      await moveCardToPosition(card.id, targetListId, targetCards.length);
    } catch {
      setToast('Не вдалося перемістити картку.');
      if (activeBoard) {
        reloadCardsOnly(activeBoard.id);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Видалити задачу?')) return;
    const previousCards = cards;
    try {
      setCards(cards.filter(c => c.id !== id));
      await axios.delete(`${API_URL}/cards/${id}/`, { headers: { Authorization: `Token ${authToken}` } });
    } catch {
      setCards(previousCards);
      setToast('Не вдалося видалити картку.');
    }
  };

  const handleToggleCardArchive = async (card: Card) => {
    const nextValue = !card.is_archived;
    setCards(cards.map(c => c.id === card.id ? { ...c, is_archived: nextValue } : c));
    try {
      await axios.patch(
        `${API_URL}/cards/${card.id}/`,
        { is_archived: nextValue },
        { headers: { Authorization: `Token ${authToken}` } }
      );
    } catch {
      setCards(cards.map(c => c.id === card.id ? { ...c, is_archived: card.is_archived } : c));
      setToast('Не вдалося змінити статус архіву картки.');
    }
  };

  const handleCreateBoard = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim() || !authToken) return;
    try {
      const res = await axios.post(
        `${API_URL}/boards/`,
        { title: newBoardTitle, background_url: newBoardBackground.trim() },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setBoards(prev => [...prev, res.data]);
      setActiveBoard(res.data);
      setEditBoardTitle(res.data.title);
      setEditBoardBackground(res.data.background_url || '');
      setNewBoardTitle('');
      setNewBoardBackground('');
      setShowCreateBoard(false);
      await reloadBoardData(res.data.id);
    } catch {
      setToast('Не вдалося створити дошку.');
    }
  };

  const handleSaveBoard = async () => {
    if (!activeBoard || !authToken) return;
    try {
      const res = await axios.patch(
        `${API_URL}/boards/${activeBoard.id}/`,
        { title: editBoardTitle, background_url: editBoardBackground.trim() },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setBoards(boards.map(b => b.id === activeBoard.id ? res.data : b));
      setActiveBoard(res.data);
      setIsEditingBoard(false);
      await reloadBoardData(activeBoard.id);
    } catch {
      setToast('Не вдалося оновити дошку.');
    }
  };

  const handleToggleBoardArchive = async () => {
    if (!activeBoard || !authToken) return;
    const nextValue = !activeBoard.is_archived;
    const confirmText = nextValue ? 'Архівувати дошку?' : 'Відновити дошку?';
    if (!window.confirm(confirmText)) return;
    try {
      const res = await axios.patch(
        `${API_URL}/boards/${activeBoard.id}/`,
        { is_archived: nextValue },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setActiveBoard(res.data);
      setBoards(boards.map(b => b.id === activeBoard.id ? res.data : b));
    } catch {
      setToast('Не вдалося змінити статус архіву дошки.');
    }
  };

  const handleToggleListArchive = async (list: List) => {
    if (!authToken) return;
    const nextValue = !list.is_archived;
    const confirmText = nextValue ? 'Архівувати список?' : 'Відновити список?';
    if (!window.confirm(confirmText)) return;
    setLists(lists.map(l => l.id === list.id ? { ...l, is_archived: nextValue } : l));
    try {
      await axios.patch(
        `${API_URL}/lists/${list.id}/`,
        { is_archived: nextValue },
        { headers: { Authorization: `Token ${authToken}` } }
      );
    } catch {
      setLists(lists.map(l => l.id === list.id ? { ...l, is_archived: list.is_archived } : l));
      setToast('Не вдалося змінити статус архіву списку.');
    }
  };

  const handleCreateList = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken || !activeBoard || !newListTitle.trim()) return;
    const maxOrder = lists.reduce((acc, list) => Math.max(acc, Number(list.order ?? 0)), 0);
    try {
      const res = await axios.post(
        `${API_URL}/lists/`,
        { title: newListTitle.trim(), board: activeBoard.id, order: maxOrder + 1 },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setLists(prev => [...prev, res.data].sort((a, b) => Number(a.order) - Number(b.order)));
      setPendingListHighlightId(res.data.id);
      setNewListTitle('');
      setShowCreateList(false);
    } catch {
      setToast('Не вдалося створити список.');
    }
  };

  const handleMoveListToPosition = async (listId: number, targetIndex: number) => {
    const sorted = [...lists].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
    const currentIndex = sorted.findIndex(list => list.id === listId);
    if (currentIndex < 0) return;
    const clampedIndex = Math.max(0, Math.min(targetIndex, sorted.length - 1));
    if (clampedIndex === currentIndex) return;

    const remaining = sorted.filter(list => list.id !== listId);
    const before = remaining[clampedIndex - 1];
    const after = remaining[clampedIndex];
    let nextOrder = 0;
    if (!before && after) nextOrder = Number(after.order) - 1;
    else if (before && !after) nextOrder = Number(before.order) + 1;
    else if (before && after) nextOrder = (Number(before.order) + Number(after.order)) / 2;

    setLists(prev => prev.map(list => list.id === listId ? { ...list, order: nextOrder } : list)
      .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)));

    if (!authToken) return;
    try {
      await axios.patch(`${API_URL}/lists/${listId}/`, { order: nextOrder }, { headers: { Authorization: `Token ${authToken}` } });
    } catch {
      setLists(sorted);
      setToast('Не вдалося перемістити список.');
    }
  };

  const handleStartRenameList = (list: List) => {
    setEditingListId(list.id);
    setEditListTitle(list.title);
  };

  const handleRenameList = async (listId: number) => {
    if (!authToken || !editListTitle.trim()) return;
    try {
      const res = await axios.patch(
        `${API_URL}/lists/${listId}/`,
        { title: editListTitle.trim() },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setLists(prev => prev.map(list => list.id === listId ? res.data : list));
      setEditingListId(null);
      setEditListTitle('');
    } catch {
      setToast('Не вдалося перейменувати список.');
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightText = (text: string) => {
    if (!normalizedSearch) return text;
    const regex = new RegExp(`(${escapeRegExp(normalizedSearch)})`, 'ig');
    const parts = text.split(regex);
    return parts.map((part, index) => (
      index % 2 === 1 ? <span key={`${part}-${index}`} className="search-highlight">{part}</span> : part
    ));
  };
  const matchesSearch = (card: Card) => {
    if (!normalizedSearch) return true;
    const haystack = `${card.title} ${card.description || ''}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  };

  const searchResults = normalizedSearch
    ? cards.filter(card => matchesSearch(card) && (showArchivedCards || !card.is_archived)).length
    : 0;
  const hasSearch = normalizedSearch.length > 0;
  const emptyListMessage = hasSearch ? 'Немає збігів.' : 'Немає карток - додайте першу.';

  const cardsForList = (listId: number) => cards
    .filter(c => (
      c.list === listId
      && (showArchivedCards || !c.is_archived)
      && matchesSearch(c)
    ))
    .sort(sortCardsByOrder);
  const visibleLists = lists.filter(list => showArchivedLists || !list.is_archived);
  const hasAnyLists = lists.length > 0;
  const sortedLists = [...lists].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const showBoardSkeleton = isBoardLoading && lists.length === 0;
  const skeletonColumns = Array.from({ length: 4 }, (_, index) => (
    <div key={`skeleton-${index}`} className="skeleton-column">
      <div className="skeleton-row">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  ));
  const isDnDEnabled = !hasSearch;
  const clearDragState = () => {
    setDraggingListId(null);
    setDragOverListId(null);
    setDraggingCardId(null);
    setDragOverCardId(null);
  };
  const handleListDragStart = (event: DragStartEvent, listId: number) => {
    if (!isDnDEnabled || !isDragEvent(event) || !event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', `list:${listId}`);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingListId(listId);
    setDraggingCardId(null);
  };
  const handleCardDragStart = (event: DragStartEvent, card: Card) => {
    if (!isDnDEnabled || card.is_archived || !isDragEvent(event) || !event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', `card:${card.id}`);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingCardId(card.id);
    setDraggingListId(null);
  };
  const handleListDragOver = (event: React.DragEvent, listId: number) => {
    if (!draggingListId && !draggingCardId) return;
    const targetList = lists.find(list => list.id === listId);
    if (!targetList || targetList.is_archived) return;
    event.preventDefault();
    setDragOverListId(listId);
  };
  const handleCardDragOver = (event: React.DragEvent, targetCard: Card) => {
    const targetList = lists.find(list => list.id === targetCard.list);
    if (!draggingCardId || draggingCardId === targetCard.id || targetCard.is_archived || targetList?.is_archived) return;
    event.preventDefault();
    setDragOverCardId(targetCard.id);
    setDragOverListId(targetCard.list);
  };
  const handleCardDropOnCard = (event: React.DragEvent, targetCard: Card) => {
    const targetList = lists.find(list => list.id === targetCard.list);
    if (!draggingCardId || draggingCardId === targetCard.id || targetCard.is_archived || targetList?.is_archived) return;
    event.preventDefault();
    event.stopPropagation();
    const targetListCards = getActiveListCards(targetCard.list);
    const targetIndex = targetListCards.findIndex(card => card.id === targetCard.id);
    const sourceIndex = targetListCards.findIndex(card => card.id === draggingCardId);
    if (targetIndex >= 0) {
      const adjustedIndex = sourceIndex >= 0 && sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      moveCardToPosition(draggingCardId, targetCard.list, adjustedIndex);
    }
    clearDragState();
  };
  const handleListDrop = (event: React.DragEvent, listId: number) => {
    if (!draggingListId && !draggingCardId) return;
    const targetList = lists.find(list => list.id === listId);
    if (!targetList || targetList.is_archived) return;
    event.preventDefault();

    if (draggingListId && draggingListId !== listId) {
      const targetIndex = sortedLists.findIndex(list => list.id === listId);
      if (targetIndex >= 0) {
        handleMoveListToPosition(draggingListId, targetIndex);
      }
    }

    if (draggingCardId) {
      const targetListCards = getActiveListCards(listId);
      moveCardToPosition(draggingCardId, listId, targetListCards.length);
    }

    clearDragState();
  };
  const activeChecklists = cardDraft ? getCardChecklists(cardDraft) : [];
  const checklistTotal = activeChecklists.reduce((acc, checklist) => acc + (checklist.items?.length || 0), 0);
  const checklistDone = activeChecklists.reduce((acc, checklist) => (
    acc + (checklist.items || []).filter(item => item.is_checked).length
  ), 0);
  const checklistPercent = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const activeLabelIds = cardDraft ? getCardLabelIds(cardDraft) : [];
  const activeListTitle = cardDraft ? (lists.find(list => list.id === cardDraft.list)?.title || '') : '';
  const commandItems = [
    {
      id: 'create-card',
      label: 'Створити картку',
      shortcut: 'N',
      action: () => {
        const fallbackList = lists.find(list => showArchivedLists || !list.is_archived);
        const targetListId = activeListId ?? fallbackList?.id;
        if (!targetListId) return;
        setActiveListId(targetListId);
        setNewTaskTitle('');
        setAddingToListId(targetListId);
      }
    },
    {
      id: 'create-list',
      label: 'Створити список',
      action: () => setShowCreateList(true)
    },
    {
      id: 'create-board',
      label: 'Створити дошку',
      action: () => setShowCreateBoard(true)
    },
    {
      id: 'toggle-archived-cards',
      label: showArchivedCards ? 'Приховати архівні картки' : 'Показати архівні картки',
      action: () => setShowArchivedCards(!showArchivedCards)
    },
    {
      id: 'toggle-archived-lists',
      label: showArchivedLists ? 'Приховати архівні списки' : 'Показати архівні списки',
      action: () => setShowArchivedLists(!showArchivedLists)
    },
    {
      id: 'go-profile',
      label: 'Перейти до профілю',
      action: () => handleRouteNavigate('/profile')
    },
    {
      id: 'go-my-cards',
      label: 'Перейти до моїх карток',
      action: () => handleRouteNavigate('/my-cards')
    },
    {
      id: 'go-faq',
      label: 'Перейти до FAQ',
      action: () => handleRouteNavigate('/faq')
    }
  ];
  const filteredCommands = commandItems.filter(item => (
    !commandQuery.trim()
    || item.label.toLowerCase().includes(commandQuery.trim().toLowerCase())
  ));

  const isBoardRoute = location.pathname === '/board' || location.pathname === '/legacy';

  if (!isBoardRoute) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="app-container">
        <div className="page-state">
          <div className="page-state-title">Завантаження...</div>
        </div>
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div className="app-container">
        <div className="page-state">
          <div className="page-state-title">Створіть першу дошку</div>
          <div className="page-state-subtitle">Почніть з нової дошки, щоб організувати задачі.</div>
          <div className="page-state-actions">
            <button className="board-btn primary" onClick={() => setShowCreateBoard(true)}>+ Нова дошка</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container board-surface" style={boardBackgroundStyle}>
      <nav className="top-nav">
        <Link to="/board" className="nav-logo" onClick={closeMobileNav}>
          Boardly / {activeBoard.title}
        </Link>
        <button
          className="nav-menu-button"
          onClick={() => setShowMobileNav(!showMobileNav)}
          aria-label="Меню"
        >
          Меню
        </button>
        <div className={`nav-actions ${showMobileNav ? 'mobile-open' : ''}`}>
          <span style={{fontSize: 14, color: 'var(--text-secondary)'}}>Привіт, {user.first_name || user.username}</span>
          <Link className="link" to="/my-cards" onClick={closeMobileNav}>Мої картки</Link>
          <Link className="link" to="/profile" onClick={closeMobileNav}>Профіль</Link>
          <Link className="link" to="/faq" onClick={closeMobileNav}>FAQ</Link>
          <button onClick={() => { closeMobileNav(); logout(); }} className="link" style={{color: 'var(--accent-danger)'}}>Вийти</button>
        </div>
      </nav>

      <div className="board-toolbar">
        {isReloading && <div className="toolbar-progress" />}
        {error && (
          <div className="toolbar-pill" style={{ color: 'var(--accent-danger)' }}>
            Немає з'єднання.{' '}
            <button className="link" onClick={() => reloadBoardData(activeBoard?.id)}>Повторити</button>
          </div>
        )}
        <div className="toolbar-row">
          <div className="toolbar-group">
            <select
              className="input toolbar-select"
              value={activeBoard.id}
              onChange={(e) => {
                const id = Number(e.target.value);
                const nextBoard = boards.find(b => b.id === id) || null;
                setActiveBoard(nextBoard);
                if (nextBoard) {
                  setEditBoardTitle(nextBoard.title);
                  setEditBoardBackground(nextBoard.background_url || '');
                }
              }}
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>
                  {board.title}{board.is_archived ? ' (архів)' : ''}
                </option>
              ))}
            </select>
            <div className="toolbar-search">
              <input
                ref={searchRef}
                className="input"
                placeholder="Пошук (/)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {normalizedSearch && (
                <button className="board-btn ghost small" onClick={() => { setSearchInput(''); setSearchQuery(''); }}>
                  Очистити
                </button>
              )}
            </div>
            {normalizedSearch && (
              <div className="toolbar-meta">
                {searchResults} збігів
              </div>
            )}
          </div>
          <div className="toolbar-group">
            <button className="board-btn ghost" onClick={() => setShowCreateBoard(!showCreateBoard)}>
              + Нова дошка
            </button>
            <button className="board-btn primary" onClick={() => setShowCreateList(!showCreateList)}>
              + Додати список
            </button>
            <button
              className={`board-btn secondary${isEditingBoard ? ' active' : ''}`}
              onClick={() => setIsEditingBoard(!isEditingBoard)}
            >
              {isEditingBoard ? 'Скасувати' : 'Налаштування'}
            </button>
            <button className="board-btn danger" onClick={handleToggleBoardArchive}>
              {activeBoard.is_archived ? 'Відновити дошку' : 'Архівувати дошку'}
            </button>
            <label className={`toolbar-pill${showArchivedCards ? ' active' : ''}`}>
              <input type="checkbox" checked={showArchivedCards} onChange={() => setShowArchivedCards(!showArchivedCards)} />
              Архівні картки
            </label>
            <label className={`toolbar-pill${showArchivedLists ? ' active' : ''}`}>
              <input type="checkbox" checked={showArchivedLists} onChange={() => setShowArchivedLists(!showArchivedLists)} />
              Архівні списки
            </label>
            <button
              className="board-btn ghost icon"
              title="/ - пошук, N - нова картка, Ctrl+K - команди"
              aria-label="Гарячі клавіші"
              onClick={() => {
                setCommandQuery('');
                setCommandOpen(true);
              }}
            >
              ?
            </button>
          </div>
        </div>

        {showCreateBoard && (
          <form onSubmit={handleCreateBoard} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ maxWidth: 240 }}
              placeholder="Назва дошки"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              required
            />
            <select
              className="input"
              style={{ maxWidth: 200 }}
              value={newBoardBackground}
              onChange={(e) => setNewBoardBackground(e.target.value)}
            >
              {BACKGROUND_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="submit" className="board-btn primary">Створити</button>
          </form>
        )}

        {showCreateList && (
          <form onSubmit={handleCreateList} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ maxWidth: 240 }}
              placeholder="Назва списку"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              required
            />
            <button type="submit" className="board-btn primary">Створити список</button>
          </form>
        )}

        {isEditingBoard && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ maxWidth: 240 }}
              value={editBoardTitle}
              onChange={(e) => setEditBoardTitle(e.target.value)}
            />
            <select
              className="input"
              style={{ maxWidth: 200 }}
              value={editBoardBackground}
              onChange={(e) => setEditBoardBackground(e.target.value)}
            >
              {BACKGROUND_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button className="board-btn primary" onClick={handleSaveBoard}>Зберегти</button>
          </div>
        )}
      </div>

      <div className="board-layout">
        {showBoardSkeleton ? (
          skeletonColumns
        ) : visibleLists.length === 0 ? (
          <div className="kanban-column empty-column">
            <div className="empty-state-title">
              {hasAnyLists ? 'Усі списки архівовані' : 'Немає списків'}
            </div>
            <div className="empty-state-subtitle">
              {hasAnyLists ? 'Увімкніть архівні списки, щоб переглянути їх.' : 'Створіть перший список на дошці.'}
            </div>
            <button
              className="board-btn primary small"
              onClick={() => {
                if (hasAnyLists) {
                  setShowArchivedLists(true);
                } else {
                  setShowCreateList(true);
                }
              }}
            >
              {hasAnyLists ? 'Показати архівні' : '+ Додати список'}
            </button>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleLists.map((list, index) => {
            const listCards = cardsForList(list.id);
            const currentListIndex = sortedLists.findIndex(sorted => sorted.id === list.id);
            return (
              <motion.div
                key={list.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18 }}
                className={`kanban-column${dragOverListId === list.id ? ' drag-over' : ''}${draggingListId === list.id ? ' dragging' : ''}`}
                onClick={() => setActiveListId(list.id)}
                onDragOver={(event) => handleListDragOver(event, list.id)}
                onDrop={(event) => handleListDrop(event, list.id)}
                ref={(node) => { listRefs.current[list.id] = node; }}
              >
                <div
                  className="list-header"
                  draggable={isDnDEnabled && !list.is_archived && editingListId !== list.id}
                  onDragStart={(event) => handleListDragStart(event, list.id)}
                  onDragEnd={clearDragState}
                >
                  <div className="list-title">
                    <div className={`dot col-${index % 3}`}></div>
                    {editingListId === list.id ? (
                      <input
                        className="input"
                        style={{ maxWidth: 160 }}
                        value={editListTitle}
                        onChange={(e) => setEditListTitle(e.target.value)}
                        onBlur={() => {
                          if (!editListTitle.trim()) {
                            setEditingListId(null);
                            setEditListTitle('');
                            return;
                          }
                          handleRenameList(list.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRenameList(list.id);
                          }
                        }}
                      />
                    ) : (
                      <span>{list.title}{list.is_archived ? ' (архів)' : ''}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="list-badge">{listCards.length}</div>
                    <div className="list-menu">
                      <button
                        className="list-menu-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenListMenuId(openListMenuId === list.id ? null : list.id);
                          setOpenCardMenuId(null);
                        }}
                        onMouseDown={(event) => event.stopPropagation()}
                        aria-label="Меню списку"
                        title="Меню списку"
                      >
                        ...
                      </button>
                      {openListMenuId === list.id && (
                        <div className="list-menu-panel" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
                          <button
                            className="menu-item"
                            onClick={() => {
                              setOpenListMenuId(null);
                              handleStartRenameList(list);
                            }}
                          >
                            Перейменувати
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => {
                              setOpenListMenuId(null);
                              handleCopyList(list);
                            }}
                          >
                            Копіювати список
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => {
                              setOpenListMenuId(null);
                              handleToggleListArchive(list);
                            }}
                          >
                            {list.is_archived ? 'Відновити список' : 'Архівувати список'}
                          </button>
                          <div className="menu-divider" />
                          <button
                            className="menu-item"
                            disabled={currentListIndex <= 0}
                            onClick={() => {
                              setOpenListMenuId(null);
                              handleMoveList(list.id, -1);
                            }}
                          >
                            Перемістити ліворуч
                          </button>
                          <button
                            className="menu-item"
                            disabled={currentListIndex < 0 || currentListIndex >= sortedLists.length - 1}
                            onClick={() => {
                              setOpenListMenuId(null);
                              handleMoveList(list.id, 1);
                            }}
                          >
                            Перемістити праворуч
                          </button>
                          <label className="menu-label">
                            Позиція
                            <select
                              className="input"
                              value={currentListIndex}
                              onChange={(event) => {
                                setOpenListMenuId(null);
                                handleMoveListToPosition(list.id, Number(event.target.value));
                              }}
                            >
                              {sortedLists.map((sortedList, position) => (
                                <option key={sortedList.id} value={position}>
                                  {position + 1}. {sortedList.title}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="task-list">
                  {listCards.length === 0 && (
                    <div className="empty-state">{emptyListMessage}</div>
                  )}
                  {listCards.map(card => {
                    const cardLabels = card.labels || [];
                    const cardChecklists = card.checklists || [];
                    const cardChecklistTotal = cardChecklists.reduce((acc, checklist) => acc + (checklist.items?.length || 0), 0);
                    const cardChecklistDone = cardChecklists.reduce((acc, checklist) => (
                      acc + (checklist.items || []).filter(item => item.is_checked).length
                    ), 0);
                    const dueLabel = card.due_date ? toDateInputValue(card.due_date) : '';
                    return (
                      <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.16 }}
                        className={`task-card${highlightCardId === card.id ? ' highlight' : ''}${draggingCardId === card.id ? ' dragging' : ''}${dragOverCardId === card.id ? ' drag-over' : ''}`}
                        style={card.is_archived ? { opacity: 0.6 } : undefined}
                        onClick={() => openCardDetails(card)}
                        draggable={isDnDEnabled && !card.is_archived && !list.is_archived}
                        onDragStart={(event) => handleCardDragStart(event, card)}
                        onDragEnd={clearDragState}
                        onDragOver={(event) => handleCardDragOver(event, card)}
                        onDrop={(event) => handleCardDropOnCard(event, card)}
                        ref={(node) => { cardRefs.current[card.id] = node; }}
                      >
                        <div className="card-meta">
                          {card.is_archived && <span className="card-badge">Архів</span>}
                          {dueLabel && <span className="card-badge due">{dueLabel}</span>}
                          {cardChecklistTotal > 0 && (
                            <span className="card-badge progress">{cardChecklistDone}/{cardChecklistTotal}</span>
                          )}
                          {cardLabels.length > 0 && (
                            <div className="card-labels">
                              {cardLabels.map(label => (
                                <span key={label.id} className="card-label" style={{ backgroundColor: label.color }} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="task-title">{highlightText(card.title)}</div>
                        {card.description && <div className="task-desc">{highlightText(card.description)}</div>}

                        <div className="task-footer">
                          <div className="card-menu">
                            <button
                              className="card-menu-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenCardMenuId(openCardMenuId === card.id ? null : card.id);
                                setOpenListMenuId(null);
                              }}
                              onMouseDown={(event) => event.stopPropagation()}
                              aria-label="Меню картки"
                              title="Меню картки"
                            >
                              ...
                            </button>
                            {openCardMenuId === card.id && (
                              <div className="card-menu-panel" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
                                <label className="menu-label">
                                  Перемістити в список
                                  <select
                                    className="input"
                                    value={card.list}
                                    onChange={(event) => {
                                      const targetId = Number(event.target.value);
                                      if (targetId !== card.list) {
                                        handleMoveCard(card, targetId);
                                      }
                                      setOpenCardMenuId(null);
                                    }}
                                  >
                                    {sortedLists.map(targetList => (
                                      <option key={targetList.id} value={targetList.id}>
                                        {targetList.title}{targetList.is_archived ? ' (архів)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    setOpenCardMenuId(null);
                                    handleCopyCard(card);
                                  }}
                                >
                                  Копіювати картку
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    setOpenCardMenuId(null);
                                    handleShareCard(card);
                                  }}
                                >
                                  Поділитися
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    setOpenCardMenuId(null);
                                    handleToggleCardArchive(card);
                                  }}
                                >
                                  {card.is_archived ? 'Відновити' : 'Архівувати'}
                                </button>
                                <button
                                  className="menu-item danger"
                                  onClick={() => {
                                    setOpenCardMenuId(null);
                                    handleDelete(card.id);
                                  }}
                                >
                                  Видалити
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {addingToListId === list.id ? (
                    <form onSubmit={(e) => handleAddTask(e, list.id)} style={{ marginTop: 12 }}>
                      <input autoFocus className="input" style={{ marginBottom: 8 }} placeholder="Назва задачі..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="board-btn primary small">Додати</button>
                        <button type="button" onClick={() => { setAddingToListId(null); setNewTaskTitle(''); }} className="board-btn ghost small">Скасувати</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => { setActiveListId(list.id); setAddingToListId(list.id); setNewTaskTitle(''); }} className="board-btn ghost small">+ Нова задача</button>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
      </div>


      <AnimatePresence>
        {cardDraft && selectedCardId && (
          <motion.div
            className="modal-backdrop"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeCardDetails();
              }
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">{cardDraft.title}</h3>
                  {activeListTitle && <div className="modal-subtitle">{activeListTitle}</div>}
                </div>
                <button
                  type="button"
                  className="btn-icon modal-close"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeCardDetails();
                  }}
                  aria-label="Закрити"
                >
                  x
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-main">
                  <div className="modal-section">
                    <div className="section-title">Опис</div>
                    <textarea
                      className="input"
                      style={{ minHeight: 100 }}
                      value={cardDraft.description || ''}
                      onChange={(e) => setCardDraft({ ...cardDraft, description: e.target.value })}
                      placeholder="Додайте опис..."
                    />
                  </div>

                  <div className="modal-section">
                    <div className="section-title">Чек-лист</div>
                    <div className="progress-row">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${checklistPercent}%` }}></div>
                      </div>
                      <div className="progress-text">{checklistDone}/{checklistTotal}</div>
                    </div>
                    {activeChecklists.map(checklist => (
                      <div key={checklist.id} className="checklist-block">
                        <div className="checklist-header">
                          <strong>{checklist.title}</strong>
                          <button className="link" onClick={() => handleRemoveChecklist(cardDraft.id, checklist.id)}>Видалити</button>
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {checklist.items.map(item => (
                            <label key={item.id} className="checklist-item">
                              <input
                                type="checkbox"
                                checked={item.is_checked}
                                onChange={() => handleToggleChecklistItem(cardDraft.id, checklist.id, item.id)}
                              />
                              <span>{item.text}</span>
                              <button
                                className="btn-icon danger"
                                onClick={() => handleRemoveChecklistItem(cardDraft.id, checklist.id, item.id)}
                              >
                                x
                              </button>
                            </label>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input
                            className="input"
                            placeholder="Новий пункт..."
                            value={newChecklistItemText[checklist.id] || ''}
                            onChange={(e) => setNewChecklistItemText(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                          />
                          <button className="board-btn primary small" onClick={() => handleAddChecklistItem(cardDraft.id, checklist.id)}>
                            Додати
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <input
                        className="input"
                        placeholder="Назва чек-листа"
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                      />
                      <button className="board-btn primary small" onClick={handleAddChecklist}>
                        Додати чек-лист
                      </button>
                    </div>
                    <div className="modal-hint">
                      Чек-лист зберігається одразу після додавання пунктів.
                    </div>
                  </div>
                </div>

                <div className="modal-sidebar">
                  <div className="modal-section">
                    <div className="section-title">Дедлайн</div>
                    <input
                      type="date"
                      className="input"
                      value={dueDateInput}
                      onChange={(e) => {
                        setDueDateInput(e.target.value);
                        setCardDraft({ ...cardDraft, due_date: e.target.value });
                      }}
                    />
                  </div>

                  <div className="modal-section">
                    <div className="section-title">Мітки</div>
                    <div className="label-list">
                      {boardLabels.length === 0 && <div className="modal-hint">Ще немає міток.</div>}
                      {boardLabels.map((label: Label) => {
                        const isActive = activeLabelIds.includes(label.id);
                        return (
                          <button
                            key={label.id}
                            className={`label-chip ${isActive ? 'active' : ''}`}
                            onClick={() => handleToggleLabel(cardDraft.id, label.id)}
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <input
                        className="input"
                        placeholder="Нова мітка"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                      />
                      <input
                        type="color"
                        value={newLabelColor}
                        onChange={(e) => setNewLabelColor(e.target.value)}
                        style={{ width: 44, height: 44, padding: 0, border: 'none', background: 'transparent' }}
                      />
                      <button className="board-btn primary small" onClick={handleAddLabel}>
                        Додати мітку
                      </button>
                    </div>
                    <div className="modal-hint">
                      Мітки зберігаються після натискання кнопки Зберегти.
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <div className="modal-footer-actions">
                  <button className="board-btn primary" onClick={handleSaveCardDetails}>
                    Зберегти
                  </button>
                  <button className="board-btn secondary" onClick={() => handleCopyCard(cardDraft)}>
                    Копіювати картку
                  </button>
                  <button className="board-btn ghost" onClick={() => handleShareCard(cardDraft)}>
                    Поділитися
                  </button>
                </div>
                {shareStatus && <span className="modal-hint">{shareStatus}</span>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {commandOpen && (
          <motion.div
            className="modal-backdrop command-backdrop"
            onClick={() => setCommandOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal command-modal"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Команди</h3>
                <span className="toolbar-meta">Ctrl+K</span>
              </div>
              <input
                className="input"
                placeholder="Почніть вводити..."
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                autoFocus
              />
              <div className="command-list">
                {filteredCommands.length === 0 ? (
                  <div className="empty-state">Команд не знайдено.</div>
                ) : (
                  filteredCommands.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className="command-item"
                      onClick={() => {
                        item.action();
                        setCommandOpen(false);
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span className="toolbar-meta">{item.shortcut}</span>}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
