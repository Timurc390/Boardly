import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { LanguageSelect } from '../components/LanguageSelect';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface MemberUser {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile?: { avatar_url?: string | null };
}

type MemberRole = 'owner' | 'admin' | 'member';
type AssignableRole = 'admin' | 'member';

interface BoardMember {
  id: number;
  user: MemberUser;
  role: MemberRole;
  isOwner?: boolean;
}

interface Board {
  id: number;
  title: string;
  description?: string;
  background_url?: string;
  is_archived?: boolean;
  invite_link?: string;
  owner?: MemberUser;
  members?: BoardMember[];
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

interface Attachment {
  id: number;
  card: number;
  file: string;
  uploaded_at: string;
}

interface CommentAuthor {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  profile?: {
    avatar_url?: string | null;
  };
}

interface Comment {
  id: number;
  card: number;
  author?: CommentAuthor;
  text: string;
  created_at: string;
}

interface Card {
  id: number;
  title: string;
  description?: string;
  card_color?: string;
  list: number;
  order?: number;
  due_date?: string | null;
  is_archived?: boolean;
  labels?: Label[];
  checklists?: Checklist[];
  attachments?: Attachment[];
  comments?: Comment[];
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

const BACKGROUND_PRESETS = [
  { key: 'board.background.default', value: '' },
  { key: 'board.background.slate', value: '#0f172a' },
  { key: 'board.background.charcoal', value: '#1f1f1f' },
  { key: 'board.background.indigo', value: '#1e1b4b' },
  { key: 'board.background.emerald', value: '#064e3b' },
  { key: 'board.background.warmLight', value: '#fff4e6' },
];
const BACKGROUND_MAX_SIZE_MB = 2;
const BACKGROUND_MAX_SIZE_BYTES = BACKGROUND_MAX_SIZE_MB * 1024 * 1024;

const CARD_COLOR_PRESETS = [
  { key: 'card.color.none', value: '' },
  { key: 'card.color.sun', value: '#fbbf24' },
  { key: 'card.color.rose', value: '#fb7185' },
  { key: 'card.color.sky', value: '#38bdf8' },
  { key: 'card.color.violet', value: '#a78bfa' },
  { key: 'card.color.emerald', value: '#34d399' },
  { key: 'card.color.teal', value: '#2dd4bf' },
  { key: 'card.color.slate', value: '#94a3b8' },
];

const BACKGROUND_GRADIENTS = [
  { key: 'board.background.gradient.sunset', value: 'linear-gradient(135deg, #f97316 0%, #ef4444 45%, #7c3aed 100%)' },
  { key: 'board.background.gradient.ocean', value: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 50%, #38bdf8 100%)' },
  { key: 'board.background.gradient.forest', value: 'linear-gradient(135deg, #064e3b 0%, #10b981 55%, #84cc16 100%)' },
  { key: 'board.background.gradient.blush', value: 'linear-gradient(135deg, #fda4af 0%, #f472b6 50%, #c084fc 100%)' },
  { key: 'board.background.gradient.night', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)' },
  { key: 'board.background.gradient.dawn', value: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #fb7185 100%)' },
];

interface LegacyBoardScreenProps {
  activeBoard?: Board | null;
  boards?: Board[];
}

export const LegacyBoardScreen: React.FC<LegacyBoardScreenProps> = ({ activeBoard: propActiveBoard, boards: propBoards }) => {
  const { authToken, user, logout, isAuthenticated, boardCache, setBoardCache, cardsCache, setCardsCacheForBoard } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const inviteHandledRef = useRef<string | null>(null);
  const locationRef = useRef(location);
  locationRef.current = location;

  const isDragEvent = (event: DragStartEvent): event is React.DragEvent<HTMLElement> | DragEvent => (
    'dataTransfer' in event
  );

  const isBackgroundColor = (value: string) => {
    const normalized = value.trim();
    return normalized.startsWith('#') || normalized.startsWith('rgb') || normalized.startsWith('hsl');
  };

  const isGradientBackground = (value: string) => /gradient\(/i.test(value.trim());

  const getBackgroundDisplayStyle = (value: string) => {
    if (!value) return {};
    if (isBackgroundColor(value)) {
      return { backgroundColor: value };
    }
    if (isGradientBackground(value)) {
      return { backgroundImage: value, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  };

  const getBackgroundPreviewStyle = (value: string) => getBackgroundDisplayStyle(value);

  const getErrorDetails = (error: any) => {
    const responseData = error?.response?.data;
    if (!responseData) return error?.message || '';
    if (typeof responseData === 'string') return responseData;
    if (typeof responseData?.detail === 'string') return responseData.detail;
    if (typeof responseData?.error === 'string') return responseData.error;
    try {
      return JSON.stringify(responseData);
    } catch {
      return '';
    }
  };

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
  const [newCommentText, setNewCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<MemberUser[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [memberActionType, setMemberActionType] = useState<'add' | 'update' | 'remove' | null>(null);
  const [memberActionId, setMemberActionId] = useState<number | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<AssignableRole>('member');
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
  const [openBoardMenu, setOpenBoardMenu] = useState(false);
  const [highlightCardId, setHighlightCardId] = useState<number | null>(null);
  const [pendingListHighlightId, setPendingListHighlightId] = useState<number | null>(null);
  const [pendingCardHighlightId, setPendingCardHighlightId] = useState<number | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [draggingListId, setDraggingListId] = useState<number | null>(null);
  const [dragOverListId, setDragOverListId] = useState<number | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<number | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<number | null>(null);

  const handleBackgroundFile = (file: File, onChange: (value: string) => void) => {
    if (!file.type.startsWith('image/')) {
      setToast(t('board.background.invalidFile'));
      return;
    }
    if (file.size > BACKGROUND_MAX_SIZE_BYTES) {
      setToast(t('board.background.tooLarge', { size: BACKGROUND_MAX_SIZE_MB }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setToast(t('board.background.invalidFile'));
        return;
      }
      onChange(result);
    };
    reader.onerror = () => {
      setToast(t('board.background.invalidFile'));
    };
    reader.readAsDataURL(file);
  };

  const renderBackgroundPicker = (
    value: string,
    onChange: (next: string) => void,
    inputId: string
  ) => {
    const previewStyle = getBackgroundPreviewStyle(value);
    const previewLabel = value
      ? (
        isBackgroundColor(value)
          ? t('board.background.colorSelected')
          : isGradientBackground(value)
            ? t('board.background.gradientSelected')
            : t('board.background.imageSelected')
      )
      : '';

    return (
      <div className="background-picker">
        <div className="background-title">{t('board.background.title')}</div>
        <div className="background-section">
          <div className="background-section-title">{t('board.background.colors')}</div>
          <div className="background-swatches">
            {BACKGROUND_PRESETS.map(option => {
              const isActive = option.value === value;
              const isDefault = option.value === '';
              return (
                <button
                  type="button"
                  key={option.value || 'default'}
                  className={`background-swatch${isActive ? ' active' : ''}${isDefault ? ' default' : ''}`}
                  style={!isDefault ? { backgroundColor: option.value } : undefined}
                  title={t(option.key)}
                  aria-label={t(option.key)}
                  onClick={() => onChange(option.value)}
                >
                  {isActive && <span className="swatch-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="background-section">
          <div className="background-section-title">{t('board.background.gradients')}</div>
          <div className="background-swatches">
            {BACKGROUND_GRADIENTS.map(option => {
              const isActive = option.value === value;
              return (
                <button
                  type="button"
                  key={option.value}
                  className={`background-swatch${isActive ? ' active' : ''}`}
                  style={{ backgroundImage: option.value }}
                  title={t(option.key)}
                  aria-label={t(option.key)}
                  onClick={() => onChange(option.value)}
                >
                  {isActive && <span className="swatch-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="background-actions">
          <label className="board-btn secondary small background-upload" htmlFor={inputId}>
            {t('board.background.upload')}
            <input
              id={inputId}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleBackgroundFile(file, onChange);
                }
                event.currentTarget.value = '';
              }}
            />
          </label>
          <button
            type="button"
            className="board-btn ghost small"
            onClick={() => onChange('')}
            disabled={!value}
          >
            {t('board.background.reset')}
          </button>
        </div>
        {value && (
          <div className="background-preview" style={previewStyle}>
            <span className="background-preview-label">{previewLabel}</span>
          </div>
        )}
      </div>
    );
  };

  const renderCardColorPicker = (
    value: string | undefined,
    onChange: (next: string) => void
  ) => {
    const selected = value || '';
    return (
      <div className="card-color-picker">
        {CARD_COLOR_PRESETS.map(option => {
          const isActive = option.value === selected;
          const isDefault = option.value === '';
          return (
            <button
              type="button"
              key={option.value || 'default'}
              className={`card-color-swatch${isActive ? ' active' : ''}${isDefault ? ' default' : ''}`}
              style={!isDefault ? { backgroundColor: option.value } : undefined}
              title={t(option.key)}
              aria-label={t(option.key)}
              onClick={() => onChange(option.value)}
            >
              {isDefault && <span className="card-color-reset">×</span>}
              {isActive && !isDefault && <span className="swatch-check">✓</span>}
            </button>
          );
        })}
      </div>
    );
  };

  const listRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const closeMobileNav = () => {
    setShowMobileNav(false);
  };

  const closeMembersModal = () => {
    setShowMembersModal(false);
    setMemberQuery('');
    setMemberResults([]);
    setIsSearchingMembers(false);
    setMemberActionId(null);
    setMemberActionType(null);
    setNewMemberRole('member');
  };

  const updateBoardState = (updater: (board: Board) => Board) => {
    if (!activeBoard) return;
    const boardId = activeBoard.id;
    setBoards(prev => prev.map(board => (board.id === boardId ? updater(board) : board)));
    setActiveBoard(prev => (prev && prev.id === boardId ? updater(prev) : prev));
  };

  const openDueDatePicker = () => {
    const input = dueDateRef.current as HTMLInputElement | null;
    if (!input || !('showPicker' in input)) return;
    try {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
    } catch {
      // Ignore if the browser blocks programmatic picker calls.
    }
  };

  const handleRouteNavigate = (path: string) => {
    setShowMobileNav(false);
    navigate(path);
    const target = new URL(path, window.location.origin);
    const expected = `${target.pathname}${target.search}`;
    setTimeout(() => {
      const current = `${locationRef.current.pathname}${locationRef.current.search}`;
      const windowCurrent = `${window.location.pathname}${window.location.search}`;
      if (current !== expected && windowCurrent === expected) {
        window.location.assign(expected);
      }
    }, 150);
  };

  const handleNavLinkClick = (event: React.MouseEvent, path: string) => {
    closeMobileNav();
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }
    event.preventDefault();
    handleRouteNavigate(path);
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
    if (!showMembersModal) return;
    if (!authToken) return;
    const query = memberQuery.trim();
    if (query.length < 2) {
      setMemberResults([]);
      setIsSearchingMembers(false);
      return;
    }
    let isActive = true;
    setIsSearchingMembers(true);
    const timer = setTimeout(() => {
      axios.get(`${API_URL}/users/?search=${encodeURIComponent(query)}`, { headers: { Authorization: `Token ${authToken}` } })
        .then(res => {
          if (!isActive) return;
          setMemberResults(res.data);
        })
        .catch(() => {
          if (!isActive) return;
          setMemberResults([]);
        })
        .finally(() => {
          if (!isActive) return;
          setIsSearchingMembers(false);
        });
    }, 250);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [authToken, memberQuery, showMembersModal]);

  useEffect(() => {
    if (!showMembersModal || !authToken || !activeBoard) return;
    let isActive = true;
    setIsMembersLoading(true);
    axios.get(`${API_URL}/board-members/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
      .then(res => {
        if (!isActive) return;
        updateBoardState(board => ({ ...board, members: res.data }));
      })
      .catch(() => {
        if (!isActive) return;
        setToast(t('toast.membersUpdateFailed'));
      })
      .finally(() => {
        if (!isActive) return;
        setIsMembersLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [activeBoard, authToken, showMembersModal]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.list-menu') || target.closest('.card-menu') || target.closest('.command-modal') || target.closest('.board-menu')) {
        return;
      }
      setOpenListMenuId(null);
      setOpenCardMenuId(null);
      setOpenBoardMenu(false);
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
    return getBackgroundDisplayStyle(activeBoard.background_url.trim());
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
  const formatTimestamp = (value?: string | null) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const resolveAttachmentUrl = (value: string) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return value.startsWith('/') ? value : `/${value}`;
  };
  const getAttachmentName = (value: string) => {
    if (!value) return 'attachment';
    const clean = value.split('?')[0];
    const parts = clean.split('/');
    return parts[parts.length - 1] || value;
  };
  const getAuthorName = (author?: CommentAuthor) => {
    if (!author) return t('common.unknown');
    const fullName = [author.first_name, author.last_name].filter(Boolean).join(' ').trim();
    return fullName || author.username || t('common.unknown');
  };
  const getMemberName = (member?: MemberUser) => {
    if (!member) return t('common.unknown');
    const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ').trim();
    return fullName || member.username || member.email || t('common.unknown');
  };
  const getMemberSecondary = (member?: MemberUser) => {
    if (!member) return '';
    return member.email || member.username || '';
  };
  const getAvatarUrl = (member?: MemberUser) => member?.profile?.avatar_url || null;
  const formatMemberRole = (role: MemberRole) => {
    if (role === 'owner') return t('members.roleOwner');
    if (role === 'admin') return t('members.roleAdmin');
    return t('members.roleMember');
  };
  const getInitials = (value: string) => {
    if (!value) return '?';
    const letters = value.trim().split(/\s+/).map(part => part[0]);
    return letters.join('').slice(0, 2).toUpperCase();
  };
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
      const message = err?.message || t('common.unknown');
      setError(t('errors.boardUpdate', { message }));
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
      setToast(t('toast.cardsReloadFailed'));
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
        const message = err?.message || t('common.unknown');
        setError(t('errors.listsLoad', { message }));
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
          const message = err?.message || t('common.unknown');
          setError(t('errors.cardsLoad', { message }));
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
    if (!boardId || !authToken) return;
    if (activeBoard?.id === boardId && boards.length) return;
    reloadBoardData(boardId);
  }, [authToken, boards, activeBoard?.id, location.search]);

  useEffect(() => {
    if (!authToken) return;
    const params = new URLSearchParams(location.search);
    const invite = params.get('invite');
    if (!invite || inviteHandledRef.current === invite) return;
    inviteHandledRef.current = invite;
    axios.post(
      `${API_URL}/boards/join/`,
      { invite_link: invite },
      { headers: { Authorization: `Token ${authToken}` } }
    )
      .then(res => {
        const joinedBoard = res.data as Board;
        setBoards(prev => {
          const exists = prev.find(board => board.id === joinedBoard.id);
          if (exists) {
            return prev.map(board => board.id === joinedBoard.id ? joinedBoard : board);
          }
          return [...prev, joinedBoard];
        });
        setActiveBoard(joinedBoard);
        setEditBoardTitle(joinedBoard.title);
        setEditBoardBackground(joinedBoard.background_url || '');
        params.delete('invite');
        params.set('board', String(joinedBoard.id));
        const nextSearch = params.toString();
        navigate({ pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
      })
      .catch(() => {
        inviteHandledRef.current = null;
        setToast(t('toast.joinFailed'));
      });
  }, [authToken, location.search, navigate]);

  useEffect(() => {
    if (!activeListId && lists.length > 0) {
      setActiveListId(lists[0].id);
    }
  }, [activeListId, lists]);

  useEffect(() => {
    if (!activeBoard) return;
    closeMembersModal();
  }, [activeBoard?.id]);

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
      const cardList = lists.find(list => list.id === card.list);
      if (cardList?.is_archived) {
        setShowArchivedLists(true);
      }
      if (card.is_archived) {
        setShowArchivedCards(true);
      }
      setSelectedCardId(card.id);
      setCardDraft({ ...card });
      setChecklistDrafts(prev => (
        prev[card.id] ? prev : { ...prev, [card.id]: cloneChecklists(card.checklists) }
      ));
      setLabelDrafts(prev => (
        prev[card.id] ? prev : { ...prev, [card.id]: (card.labels || []).map((label: Label) => label.id) }
      ));
    }
  }, [cards, lists, location.search, selectedCardId]);

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

      if (event.key === 'Escape' && showMembersModal) {
        closeMembersModal();
        return;
      }

      if (event.key === 'Escape' && selectedCardId) {
        closeCardDetails();
        return;
      }

      if (event.key === 'Escape' && openBoardMenu) {
        setOpenBoardMenu(false);
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      const isCommandShortcut = (event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'k' || event.key === '.');
      if (isCommandShortcut) {
        event.preventDefault();
        event.stopPropagation();
        (event as KeyboardEvent & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
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

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [activeListId, commandOpen, lists, openBoardMenu, selectedCardId, showArchivedLists, showMembersModal]);

  const getNextTempId = () => -Math.floor(Date.now() + Math.random() * 1000);

  const openCardDetails = (card: Card) => {
    setSelectedCardId(card.id);
    setCardDraft({ ...card });
    setDueDateInput(toDateInputValue(card.due_date));
    setShareStatus('');
    setNewCommentText('');
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
    setNewCommentText('');
    setIsAddingComment(false);
    setIsUploadingAttachment(false);
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
      setToast(t('toast.checklistSaveFailed'));
      updateChecklistDraft(cardDraft.id, (checklists) => checklists.filter(checklist => checklist.id !== tempId));
    }
  };

  const handleRemoveChecklist = async (cardId: number, checklistId: number) => {
    updateChecklistDraft(cardId, (checklists) => checklists.filter(checklist => checklist.id !== checklistId));
    if (!authToken || checklistId < 0) return;
    try {
      await axios.delete(`${API_URL}/checklists/${checklistId}/`, { headers: { Authorization: `Token ${authToken}` } });
    } catch {
      setToast(t('toast.checklistDeleteFailed'));
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
      setToast(t('toast.checklistItemAddFailed'));
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
      setToast(t('toast.labelCreateFailed'));
    }
  };

  const updateCardState = (cardId: number, updater: (card: Card) => Card) => {
    setCards(prev => prev.map(card => (card.id === cardId ? updater(card) : card)));
    setCardDraft(prev => (prev && prev.id === cardId ? updater(prev) : prev));
  };

  const handleAddComment = async () => {
    if (!cardDraft || !authToken) return;
    const text = newCommentText.trim();
    if (!text) return;
    setIsAddingComment(true);
    try {
      const res = await axios.post(
        `${API_URL}/comments/`,
        { card: cardDraft.id, text },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      const newComment = res.data as Comment;
      updateCardState(cardDraft.id, (card) => ({
        ...card,
        comments: [...(card.comments || []), newComment]
      }));
      setNewCommentText('');
    } catch {
      setToast(t('toast.commentAddFailed'));
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!cardDraft || !authToken) return;
    try {
      await axios.delete(`${API_URL}/comments/${commentId}/`, {
        headers: { Authorization: `Token ${authToken}` }
      });
      updateCardState(cardDraft.id, (card) => ({
        ...card,
        comments: (card.comments || []).filter(comment => comment.id !== commentId)
      }));
    } catch {
      setToast(t('toast.commentDeleteFailed'));
    }
  };

  const handleAddAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!cardDraft || !authToken) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingAttachment(true);
    const formData = new FormData();
    formData.append('card', String(cardDraft.id));
    formData.append('file', file);
    try {
      const res = await axios.post(`${API_URL}/attachments/`, formData, {
        headers: { Authorization: `Token ${authToken}` }
      });
      const newAttachment = res.data as Attachment;
      updateCardState(cardDraft.id, (card) => ({
        ...card,
        attachments: [...(card.attachments || []), newAttachment]
      }));
      setToast(t('toast.attachmentAdded'));
    } catch {
      setToast(t('toast.attachmentAddFailed'));
    } finally {
      setIsUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!cardDraft || !authToken) return;
    try {
      await axios.delete(`${API_URL}/attachments/${attachmentId}/`, {
        headers: { Authorization: `Token ${authToken}` }
      });
      updateCardState(cardDraft.id, (card) => ({
        ...card,
        attachments: (card.attachments || []).filter(attachment => attachment.id !== attachmentId)
      }));
    } catch {
      setToast(t('toast.attachmentDeleteFailed'));
    }
  };

  const startMemberAction = (type: 'add' | 'update' | 'remove', id: number) => {
    setMemberActionType(type);
    setMemberActionId(id);
  };

  const stopMemberAction = () => {
    setMemberActionType(null);
    setMemberActionId(null);
  };

  const handleAddMember = async (userId: number) => {
    if (!authToken || !activeBoard) return;
    if (!canManageMembers) return;
    startMemberAction('add', userId);
    try {
      const res = await axios.post(
        `${API_URL}/board-members/`,
        { user_id: userId, board_id: activeBoard.id, role: newMemberRole },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      const newMember = res.data as BoardMember;
      updateBoardState((board) => {
        const existing = (board.members || []).filter(member => member.user.id !== newMember.user.id);
        return { ...board, members: [...existing, newMember] };
      });
      setMemberQuery('');
      setMemberResults([]);
      setNewMemberRole('member');
    } catch {
      setToast(t('toast.memberAddFailed'));
    } finally {
      stopMemberAction();
    }
  };

  const handleUpdateMemberRole = async (member: BoardMember, nextRole: AssignableRole) => {
    if (!authToken || !activeBoard) return;
    if (!canManageMembers || member.isOwner) return;
    if (member.role === nextRole) return;
    startMemberAction('update', member.id);
    try {
      const res = await axios.patch(
        `${API_URL}/board-members/${member.id}/`,
        { role: nextRole },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      const updated = res.data as BoardMember;
      updateBoardState((board) => ({
        ...board,
        members: (board.members || []).map(item => item.id === updated.id ? { ...item, role: updated.role } : item)
      }));
    } catch {
      setToast(t('toast.memberRoleFailed'));
    } finally {
      stopMemberAction();
    }
  };

  const handleRemoveMember = async (member: BoardMember) => {
    if (!authToken || !activeBoard) return;
    if (!canManageMembers || member.isOwner) return;
    startMemberAction('remove', member.id);
    try {
      await axios.delete(`${API_URL}/board-members/${member.id}/`, {
        headers: { Authorization: `Token ${authToken}` }
      });
      updateBoardState((board) => ({
        ...board,
        members: (board.members || []).filter(item => item.id !== member.id)
      }));
      if (member.user.id === user?.id) {
        closeMembersModal();
        reloadBoardData();
      }
    } catch {
      setToast(t('toast.memberRemoveFailed'));
    } finally {
      stopMemberAction();
    }
  };

  const handleCopyInviteLink = async () => {
    if (!activeBoard?.invite_link) {
      setToast(t('toast.inviteUnavailable'));
      return;
    }
    const link = `${window.location.origin}/board?invite=${activeBoard.invite_link}`;
    try {
      await navigator.clipboard.writeText(link);
      setToast(t('common.linkCopied'));
    } catch {
      window.prompt(t('prompt.copyLink'), link);
    }
  };

  const handleInviteByEmail = async () => {
    if (!memberQuery.trim()) return;
    await handleCopyInviteLink();
  };

  const handleSaveCardDetails = async () => {
    if (!cardDraft || !authToken) return;
    try {
      const res = await axios.patch(
        `${API_URL}/cards/${cardDraft.id}/`,
        {
          description: cardDraft.description || '',
          card_color: cardDraft.card_color || '',
          due_date: toApiDueDate(dueDateInput),
          label_ids: getCardLabelIds(cardDraft)
        },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setCards(cards.map(c => c.id === cardDraft.id ? res.data : c));
      setCardDraft(res.data);
    } catch {
      setToast(t('toast.cardSaveFailed'));
    }
  };

  const handleShareCard = async (card: Card) => {
    if (!activeBoard) return;
    const link = `${window.location.origin}/board?board=${activeBoard.id}&card=${card.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setShareStatus(t('common.linkCopied'));
      setToast(t('common.linkCopied'));
    } catch {
      window.prompt(t('prompt.copyLink'), link);
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
          title: `${card.title}${t('common.copySuffix')}`,
          description: card.description || '',
          card_color: card.card_color || '',
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
      setToast(t('toast.cardCopied'));
    } catch {
      setToast(t('toast.cardCopyFailed'));
    }
  };

  const handleCopyList = async (list: List) => {
    if (!authToken || !activeBoard) {
      setToast(t('toast.listCopyFailed'));
      return;
    }
    const maxOrder = lists.reduce((acc, l) => Math.max(acc, Number(l.order ?? 0)), 0);
    try {
      setToast(t('toast.listCopying'));
      const res = await axios.post(
        `${API_URL}/lists/`,
        { title: `${list.title}${t('common.copySuffix')}`, board: activeBoard.id, order: maxOrder + 1 },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      const newList = res.data as List;
      setLists(prev => [...prev, newList].sort((a, b) => Number(a.order) - Number(b.order)));
      setPendingListHighlightId(newList.id);

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
              card_color: card.card_color || '',
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
      await reloadBoardData(activeBoard.id);
      setToast(t('toast.listCopied'));
    } catch (error: any) {
      const details = getErrorDetails(error);
      setToast(details ? `${t('toast.listCopyFailed')}: ${details}` : t('toast.listCopyFailed'));
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
      setToast(t('toast.listMoveFailed'));
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
      setToast(t('toast.cardCreateFailed'));
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
      setToast(t('toast.cardMoveFailed'));
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
      setToast(t('toast.cardMoveFailed'));
      if (activeBoard) {
        reloadCardsOnly(activeBoard.id);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('confirm.deleteCard'))) return;
    const previousCards = cards;
    try {
      setCards(cards.filter(c => c.id !== id));
      await axios.delete(`${API_URL}/cards/${id}/`, { headers: { Authorization: `Token ${authToken}` } });
    } catch {
      setCards(previousCards);
      setToast(t('toast.cardDeleteFailed'));
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
      setToast(t('toast.cardArchiveFailed'));
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
      setToast(t('toast.boardCreateFailed'));
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
      setToast(t('toast.boardUpdateFailed'));
    }
  };

  const handleToggleBoardArchive = async () => {
    if (!activeBoard || !authToken) return;
    const nextValue = !activeBoard.is_archived;
    const confirmText = nextValue ? t('board.archiveConfirm') : t('board.unarchiveConfirm');
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
      setToast(t('toast.boardArchiveFailed'));
    }
  };

  const handleToggleListArchive = async (list: List) => {
    if (!authToken) return;
    const nextValue = !list.is_archived;
    const confirmText = nextValue ? t('list.archiveConfirm') : t('list.unarchiveConfirm');
    if (!window.confirm(confirmText)) return;
    setLists(lists.map(l => l.id === list.id ? { ...l, is_archived: nextValue } : l));
    if (nextValue) {
      setShowArchivedLists(true);
    }
    try {
      await axios.patch(
        `${API_URL}/lists/${list.id}/`,
        { is_archived: nextValue },
        { headers: { Authorization: `Token ${authToken}` } }
      );
    } catch {
      setLists(lists.map(l => l.id === list.id ? { ...l, is_archived: list.is_archived } : l));
      setToast(t('toast.listArchiveFailed'));
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
      setToast(t('toast.listCreateFailed'));
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
      setToast(t('toast.listMoveFailed'));
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
      setToast(t('toast.listRenameFailed'));
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
  const emptyListMessage = hasSearch ? t('toolbar.noMatches') : t('card.empty');

  const cardsForList = (listId: number) => cards
    .filter(c => (
      c.list === listId
      && (showArchivedCards || !c.is_archived)
      && matchesSearch(c)
    ))
    .sort(sortCardsByOrder);
  const hasAnyLists = lists.length > 0;
  const sortedLists = [...lists].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const visibleLists = sortedLists.filter(list => showArchivedLists || !list.is_archived);
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
  const normalizedMembers = (activeBoard?.members || []).map(member => ({
    ...member,
    role: member.role as MemberRole
  }));
  const ownerMember = activeBoard?.owner
    ? { id: -1, user: activeBoard.owner, role: 'owner' as MemberRole, isOwner: true }
    : null;
  const mergedMembers = ownerMember
    ? [ownerMember, ...normalizedMembers.filter(member => member.user.id !== ownerMember.user.id)]
    : normalizedMembers;
  const existingMemberIds = new Set(mergedMembers.map(member => member.user.id));
  const filteredMemberResults = memberResults.filter(result => !existingMemberIds.has(result.id));
  const visibleMembers = mergedMembers.slice(0, 4);
  const extraMembers = Math.max(0, mergedMembers.length - visibleMembers.length);
  const currentMembership = normalizedMembers.find(member => member.user.id === user?.id);
  const isOwner = activeBoard?.owner?.id === user?.id;
  const canManageMembers = Boolean(isOwner || currentMembership?.role === 'admin');
  const inviteLink = activeBoard?.invite_link
    ? `${window.location.origin}/board?invite=${activeBoard.invite_link}`
    : '';
  const activeAttachments = cardDraft?.attachments || [];
  const activeComments = cardDraft?.comments || [];
  const commandItems = [
    {
      id: 'create-card',
      label: t('command.createCard'),
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
      label: t('command.createList'),
      action: () => setShowCreateList(true)
    },
    {
      id: 'create-board',
      label: t('command.createBoard'),
      action: () => setShowCreateBoard(true)
    },
    {
      id: 'toggle-archived-cards',
      label: showArchivedCards ? t('archive.hideCards') : t('archive.showCards'),
      action: () => setShowArchivedCards(prev => !prev)
    },
    {
      id: 'toggle-archived-lists',
      label: showArchivedLists ? t('archive.hideLists') : t('archive.showLists'),
      action: () => setShowArchivedLists(prev => !prev)
    },
    {
      id: 'go-profile',
      label: t('command.goProfile'),
      action: () => handleRouteNavigate('/profile')
    },
    {
      id: 'go-my-cards',
      label: t('command.goMyCards'),
      action: () => handleRouteNavigate('/my-cards')
    },
    {
      id: 'go-faq',
      label: t('command.goFaq'),
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
          <div className="page-state-title">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div className="app-container">
        <div className="page-state">
          <div className="page-state-title">{t('board.empty.title')}</div>
          <div className="page-state-subtitle">{t('board.empty.subtitle')}</div>
          <div className="page-state-actions">
            {showCreateBoard ? (
              <form onSubmit={handleCreateBoard} className="toolbar-panel">
                <input
                  className="input"
                  style={{ maxWidth: 240 }}
                  placeholder={t('board.create.titlePlaceholder')}
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  required
                />
                {renderBackgroundPicker(newBoardBackground, setNewBoardBackground, 'empty-board-background')}
                <button type="submit" className="board-btn primary">{t('common.create')}</button>
                <button type="button" className="board-btn ghost" onClick={() => setShowCreateBoard(false)}>
                  {t('common.cancel')}
                </button>
              </form>
            ) : (
              <button className="board-btn primary" onClick={() => setShowCreateBoard(true)}>{t('board.create.newButton')}</button>
            )}
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
          aria-label={t('nav.menu')}
        >
          {t('nav.menu')}
        </button>
        <div className={`nav-actions ${showMobileNav ? 'mobile-open' : ''}`}>
          <span className="nav-greeting">{t('nav.greeting', { name: user.first_name || user.username })}</span>
          <Link className="link" to="/my-cards" onClick={(event) => handleNavLinkClick(event, '/my-cards')}>{t('nav.myCards')}</Link>
          <Link className="link" to="/profile" onClick={(event) => handleNavLinkClick(event, '/profile')}>{t('nav.profile')}</Link>
          <Link className="link" to="/faq" onClick={(event) => handleNavLinkClick(event, '/faq')}>{t('nav.faq')}</Link>
          <LanguageSelect compact />
          <button onClick={() => { closeMobileNav(); logout(); }} className="link" style={{color: 'var(--accent-danger)'}}>{t('nav.logout')}</button>
        </div>
      </nav>

      <div className="board-toolbar">
        {isReloading && <div className="toolbar-progress" />}
        {error && (
          <div className="toolbar-pill" style={{ color: 'var(--accent-danger)' }}>
            {t('common.noConnection')}{' '}
            <button className="link" onClick={() => reloadBoardData(activeBoard?.id)}>{t('common.retry')}</button>
          </div>
        )}
        <div className="toolbar-row">
          <div className="toolbar-group toolbar-group-primary">
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
                  {board.title}{board.is_archived ? ` ${t('board.archivedSuffix')}` : ''}
                </option>
              ))}
            </select>
            <div className="toolbar-search">
              <input
                ref={searchRef}
                className="input"
                placeholder={t('toolbar.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {normalizedSearch && (
                <button className="board-btn ghost small" onClick={() => { setSearchInput(''); setSearchQuery(''); }}>
                  {t('common.clear')}
                </button>
              )}
            </div>
            {normalizedSearch && (
              <div className="toolbar-meta">
                {searchResults} {t('toolbar.matches')}
              </div>
            )}
          </div>
          <div className="toolbar-group toolbar-group-actions">
            <button
              className="board-btn primary"
              onClick={() => {
                setShowCreateList(!showCreateList);
                setShowCreateBoard(false);
                setIsEditingBoard(false);
                setOpenBoardMenu(false);
              }}
            >
              {t('list.addButton')}
            </button>
            <label className={`toolbar-pill${showArchivedCards ? ' active' : ''}`}>
              <input type="checkbox" checked={showArchivedCards} onChange={() => setShowArchivedCards(prev => !prev)} />
              {t('archive.cards')}
            </label>
            <label className={`toolbar-pill${showArchivedLists ? ' active' : ''}`}>
              <input type="checkbox" checked={showArchivedLists} onChange={() => setShowArchivedLists(prev => !prev)} />
              {t('archive.lists')}
            </label>
            <button
              type="button"
              className="board-btn secondary members-trigger"
              onClick={() => {
                setShowMembersModal(true);
                setOpenBoardMenu(false);
                setOpenListMenuId(null);
                setOpenCardMenuId(null);
              }}
              disabled={!activeBoard}
              aria-label={t('members.shareAria')}
            >
              <div className="member-avatars" aria-hidden="true">
                {visibleMembers.map(member => {
                  const memberName = getMemberName(member.user);
                  const avatarUrl = getAvatarUrl(member.user);
                  return (
                    <span key={`${member.user.id}-${member.role}`} className="member-avatar" title={memberName}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={memberName} />
                      ) : (
                        getInitials(memberName)
                      )}
                    </span>
                  );
                })}
                {extraMembers > 0 && (
                  <span className="member-avatar member-avatar-more" title={t('members.more', { count: extraMembers })}>
                    +{extraMembers}
                  </span>
                )}
              </div>
              <span className="members-label">{t('common.share')}</span>
            </button>
            <div className="toolbar-divider" aria-hidden="true" />
            <div className="board-menu">
              <button
                className="board-btn secondary icon"
                onClick={() => {
                  setOpenBoardMenu(!openBoardMenu);
                  setOpenListMenuId(null);
                  setOpenCardMenuId(null);
                }}
                aria-label={t('board.menu')}
                title={t('board.menu')}
              >
                ...
              </button>
              {openBoardMenu && (
                <div className="board-menu-panel" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
                  <button
                    className="menu-item"
                    onClick={() => {
                      setOpenBoardMenu(false);
                      setShowCreateBoard(true);
                      setShowCreateList(false);
                      setIsEditingBoard(false);
                    }}
                  >
                    {t('board.create.newButton')}
                  </button>
                  <button
                    className="menu-item"
                    onClick={() => {
                      setOpenBoardMenu(false);
                      setIsEditingBoard(!isEditingBoard);
                      setShowCreateBoard(false);
                      setShowCreateList(false);
                    }}
                  >
                    {isEditingBoard ? t('common.cancel') : t('board.settings')}
                  </button>
                  <button
                    className="menu-item"
                    onClick={() => {
                      setOpenBoardMenu(false);
                      setShowMembersModal(true);
                    }}
                  >
                    {t('members.title')}
                  </button>
                  <div className="menu-divider" />
                  <button
                    className="menu-item danger"
                    onClick={() => {
                      setOpenBoardMenu(false);
                      handleToggleBoardArchive();
                    }}
                  >
                    {activeBoard.is_archived ? t('board.unarchive') : t('board.archive')}
                  </button>
                </div>
              )}
            </div>
            <button
              className="board-btn ghost icon"
              title={t('hotkeys.hint')}
              aria-label={t('hotkeys.aria')}
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
          <form onSubmit={handleCreateBoard} className="toolbar-panel">
            <input
              className="input"
              style={{ maxWidth: 240 }}
              placeholder={t('board.create.titlePlaceholder')}
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              required
            />
            {renderBackgroundPicker(newBoardBackground, setNewBoardBackground, 'new-board-background')}
            <button type="submit" className="board-btn primary">{t('common.create')}</button>
          </form>
        )}

        {showCreateList && (
          <form onSubmit={handleCreateList} className="toolbar-panel">
            <input
              className="input"
              style={{ maxWidth: 240 }}
              placeholder={t('list.create.placeholder')}
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              required
            />
            <button type="submit" className="board-btn primary">{t('list.create.submit')}</button>
          </form>
        )}

        {isEditingBoard && (
          <div className="toolbar-panel">
            <input
              className="input"
              style={{ maxWidth: 240 }}
              value={editBoardTitle}
              onChange={(e) => setEditBoardTitle(e.target.value)}
            />
            {renderBackgroundPicker(editBoardBackground, setEditBoardBackground, 'edit-board-background')}
            <button className="board-btn primary" onClick={handleSaveBoard}>{t('common.save')}</button>
          </div>
        )}
      </div>

      <div className="board-layout">
        {showBoardSkeleton ? (
          skeletonColumns
        ) : visibleLists.length === 0 ? (
          <div className="kanban-column empty-column">
            <div className="empty-state-title">
              {hasAnyLists ? t('list.empty.archivedTitle') : t('list.empty.noneTitle')}
            </div>
            <div className="empty-state-subtitle">
              {hasAnyLists ? t('list.empty.archivedSubtitle') : t('list.empty.noneSubtitle')}
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
              {hasAnyLists ? t('list.empty.showArchived') : t('list.addButton')}
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
                      <span>{list.title}{list.is_archived ? ` ${t('board.archivedSuffix')}` : ''}</span>
                    )}
                  </div>
                  <div className="list-actions">
                    <div className="list-badge">{listCards.length}</div>
                    <div className="list-menu">
                      <button
                        className="list-menu-button"
                        onClick={(event) => {
                          event.stopPropagation();
                                setOpenListMenuId(openListMenuId === list.id ? null : list.id);
                                setOpenCardMenuId(null);
                                setOpenBoardMenu(false);
                        }}
                        onMouseDown={(event) => event.stopPropagation()}
                        aria-label={t('list.menu')}
                        title={t('list.menu')}
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
                            {t('list.rename')}
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => {
                              setOpenListMenuId(null);
                              handleCopyList(list);
                            }}
                          >
                            {t('list.copy')}
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => {
                              setOpenListMenuId(null);
                              handleToggleListArchive(list);
                            }}
                          >
                            {list.is_archived ? t('list.unarchive') : t('list.archive')}
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
                            {t('list.moveLeft')}
                          </button>
                          <button
                            className="menu-item"
                            disabled={currentListIndex < 0 || currentListIndex >= sortedLists.length - 1}
                            onClick={() => {
                              setOpenListMenuId(null);
                              handleMoveList(list.id, 1);
                            }}
                          >
                            {t('list.moveRight')}
                          </button>
                          <label className="menu-label">
                            {t('list.position')}
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
                        {card.card_color && <div className="card-color-bar" style={{ backgroundColor: card.card_color }} />}
                        <div className="card-meta">
                          {card.is_archived && <span className="card-badge">{t('archive.badge')}</span>}
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
                                setOpenBoardMenu(false);
                              }}
                              onMouseDown={(event) => event.stopPropagation()}
                              aria-label={t('card.menu')}
                              title={t('card.menu')}
                            >
                              ...
                            </button>
                            {openCardMenuId === card.id && (
                              <div className="card-menu-panel" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
                                <label className="menu-label">
                                  {t('card.moveToList')}
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
                                        {targetList.title}{targetList.is_archived ? ` ${t('board.archivedSuffix')}` : ''}
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
                                  {t('card.copy')}
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    setOpenCardMenuId(null);
                                    handleShareCard(card);
                                  }}
                                >
                                  {t('common.share')}
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    setOpenCardMenuId(null);
                                    handleToggleCardArchive(card);
                                  }}
                                >
                                  {card.is_archived ? t('card.unarchive') : t('card.archive')}
                                </button>
                                <button
                                  className="menu-item danger"
                                  onClick={() => {
                                    setOpenCardMenuId(null);
                                    handleDelete(card.id);
                                  }}
                                >
                                  {t('common.delete')}
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
                      <input autoFocus className="input" style={{ marginBottom: 8 }} placeholder={t('card.create.placeholder')} value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="board-btn primary small">{t('common.add')}</button>
                        <button type="button" onClick={() => { setAddingToListId(null); setNewTaskTitle(''); }} className="board-btn ghost small">{t('common.cancel')}</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => { setActiveListId(list.id); setAddingToListId(list.id); setNewTaskTitle(''); }} className="board-btn ghost small">{t('card.create.newButton')}</button>
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
                  aria-label={t('common.close')}
                >
                  x
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-main">
                  <div className="modal-section">
                    <div className="section-title">{t('card.descriptionTitle')}</div>
                    <textarea
                      className="input"
                      style={{ minHeight: 100 }}
                      value={cardDraft.description || ''}
                      onChange={(e) => setCardDraft({ ...cardDraft, description: e.target.value })}
                      placeholder={t('card.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="modal-section">
                    <div className="section-title">{t('checklist.title')}</div>
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
                          <button className="link" onClick={() => handleRemoveChecklist(cardDraft.id, checklist.id)}>
                            {t('common.delete')}
                          </button>
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
                            placeholder={t('checklist.itemPlaceholder')}
                            value={newChecklistItemText[checklist.id] || ''}
                            onChange={(e) => setNewChecklistItemText(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                          />
                          <button className="board-btn primary small" onClick={() => handleAddChecklistItem(cardDraft.id, checklist.id)}>
                            {t('common.add')}
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <input
                        className="input"
                        placeholder={t('checklist.titlePlaceholder')}
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                      />
                      <button className="board-btn primary small" onClick={handleAddChecklist}>
                        {t('checklist.add')}
                      </button>
                    </div>
                    <div className="modal-hint">{t('checklist.hint')}</div>
                  </div>

                  <div className="modal-section">
                    <div className="section-title">{t('attachments.title')}</div>
                    {activeAttachments.length === 0 ? (
                      <div className="modal-hint">{t('attachments.empty')}</div>
                    ) : (
                      <div className="attachment-list">
                        {activeAttachments.map((attachment) => {
                          const attachmentUrl = resolveAttachmentUrl(attachment.file);
                          const attachmentName = getAttachmentName(attachment.file);
                          return (
                            <div key={attachment.id} className="attachment-item">
                              <div className="attachment-info">
                                <a
                                  className="attachment-link"
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {attachmentName}
                                </a>
                                <span className="attachment-meta">{formatTimestamp(attachment.uploaded_at)}</span>
                              </div>
                              <button
                                className="link danger"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                              >
                                {t('common.delete')}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="attachment-actions">
                      <input
                        id={`attachment-${cardDraft.id}`}
                        type="file"
                        className="file-input"
                        onChange={handleAddAttachment}
                        disabled={isUploadingAttachment}
                      />
                      <label
                        htmlFor={`attachment-${cardDraft.id}`}
                        className={`board-btn ghost small${isUploadingAttachment ? ' disabled' : ''}`}
                        aria-disabled={isUploadingAttachment}
                      >
                        {isUploadingAttachment ? t('common.loading') : t('attachments.add')}
                      </label>
                    </div>
                  </div>

                  <div className="modal-section">
                    <div className="section-title">{t('comments.title')}</div>
                    {activeComments.length === 0 ? (
                      <div className="modal-hint">{t('comments.empty')}</div>
                    ) : (
                      <div className="comment-list">
                        {activeComments.map((comment) => {
                          const authorName = getAuthorName(comment.author);
                          return (
                            <div key={comment.id} className="comment-item">
                              <div className="comment-header">
                                <div className="comment-author">
                                  <span className="comment-avatar">{getInitials(authorName)}</span>
                                  <span>{authorName}</span>
                                </div>
                                <div className="comment-actions">
                                  <span className="comment-meta">{formatTimestamp(comment.created_at)}</span>
                                  {comment.author?.id === user?.id && (
                                    <button
                                      className="link danger"
                                      onClick={() => handleDeleteComment(comment.id)}
                                    >
                                      {t('common.delete')}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="comment-body">{comment.text}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="comment-form">
                      <textarea
                        className="input"
                        value={newCommentText}
                        onChange={(event) => setNewCommentText(event.target.value)}
                        placeholder={t('comment.placeholder')}
                        rows={3}
                        disabled={isAddingComment}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className="board-btn primary small"
                          onClick={handleAddComment}
                          disabled={isAddingComment || !newCommentText.trim()}
                        >
                          {isAddingComment ? t('common.saving') : t('comments.add')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-sidebar">
                  <div className="modal-section">
                    <div className="section-title">{t('card.dueDate')}</div>
                    <input
                      type="date"
                      className="input"
                      ref={dueDateRef}
                      value={dueDateInput}
                      onClick={openDueDatePicker}
                      onChange={(e) => {
                        setDueDateInput(e.target.value);
                        setCardDraft({ ...cardDraft, due_date: e.target.value });
                      }}
                    />
                  </div>

                  <div className="modal-section">
                    <div className="section-title">{t('labels.title')}</div>
                    <div className="label-list">
                      {boardLabels.length === 0 && <div className="modal-hint">{t('labels.empty')}</div>}
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
                        placeholder={t('labels.newPlaceholder')}
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
                        {t('labels.add')}
                      </button>
                    </div>
                    <div className="modal-hint">{t('labels.hint', { action: t('common.save') })}</div>
                  </div>

                  <div className="modal-section">
                    <div className="section-title">{t('card.colorTitle')}</div>
                    {renderCardColorPicker(cardDraft.card_color, (value) => (
                      setCardDraft({ ...cardDraft, card_color: value })
                    ))}
                    <div className="modal-hint">{t('card.colorHint')}</div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <div className="modal-footer-actions">
                  <button className="board-btn primary" onClick={handleSaveCardDetails}>
                    {t('common.save')}
                  </button>
                  <button className="board-btn secondary" onClick={() => handleCopyCard(cardDraft)}>
                    {t('card.copy')}
                  </button>
                  <button className="board-btn ghost" onClick={() => handleShareCard(cardDraft)}>
                    {t('common.share')}
                  </button>
                </div>
                {shareStatus && <span className="modal-hint">{shareStatus}</span>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMembersModal && (
          <motion.div
            className="modal-backdrop"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeMembersModal();
              }
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal members-modal"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">{t('members.modalTitle')}</h3>
                  <div className="modal-subtitle">{activeBoard?.title}</div>
                </div>
                <button
                  type="button"
                  className="btn-icon modal-close"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeMembersModal();
                  }}
                  aria-label={t('common.close')}
                >
                  x
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-section">
                  <div className="section-title">{t('members.inviteTitle')}</div>
                  <div className="member-search">
                    <input
                      className="input"
                      placeholder={t('members.searchPlaceholder')}
                      value={memberQuery}
                      onChange={(event) => setMemberQuery(event.target.value)}
                      autoFocus
                    />
                    <select
                      className="input"
                      value={newMemberRole}
                      onChange={(event) => setNewMemberRole(event.target.value as AssignableRole)}
                      disabled={!canManageMembers}
                    >
                      <option value="member">{t('members.roleMember')}</option>
                      <option value="admin">{t('members.roleAdmin')}</option>
                    </select>
                  </div>
                  {inviteLink && (
                    <div className="member-invite">
                      <input className="input" value={inviteLink} readOnly />
                      <button className="board-btn ghost small" onClick={handleCopyInviteLink}>
                        {t('common.copyLink')}
                      </button>
                    </div>
                  )}
                  {isMembersLoading && <div className="modal-hint">{t('members.refreshing')}</div>}
                  {isSearchingMembers && <div className="modal-hint">{t('members.searching')}</div>}
                  {!canManageMembers && (
                    <div className="modal-hint">{t('members.permissionsHint')}</div>
                  )}
                  {!isSearchingMembers && memberQuery.trim().length >= 2 && filteredMemberResults.length === 0 && (
                    <div className="member-empty">
                      <div className="modal-hint">{t('members.empty')}</div>
                      {memberQuery.includes('@') && (
                        <button
                          className="board-btn secondary small"
                          onClick={handleInviteByEmail}
                          disabled={!canManageMembers}
                        >
                          {t('members.inviteEmail')}
                        </button>
                      )}
                    </div>
                  )}
                  {filteredMemberResults.length > 0 && (
                    <div className="member-results">
                      {filteredMemberResults.slice(0, 6).map(result => {
                        const memberName = getMemberName(result);
                        const avatarUrl = getAvatarUrl(result);
                        const isAdding = memberActionType === 'add' && memberActionId === result.id;
                        return (
                          <div key={result.id} className="member-result-item">
                            <div className="member-info">
                              <span className="member-avatar">
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt={memberName} />
                                ) : (
                                  getInitials(memberName)
                                )}
                              </span>
                              <div>
                                <div className="member-name">{memberName}</div>
                                <div className="member-meta">{getMemberSecondary(result)}</div>
                              </div>
                            </div>
                            <button
                              className="board-btn primary small"
                              onClick={() => handleAddMember(result.id)}
                              disabled={!canManageMembers || isAdding}
                            >
                              {isAdding ? t('members.adding') : t('common.add')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="modal-section">
                  <div className="section-title">{t('members.title')} ({mergedMembers.length})</div>
                  <div className="member-list">
                    {mergedMembers.map(member => {
                      const memberName = getMemberName(member.user);
                      const memberMeta = getMemberSecondary(member.user);
                      const avatarUrl = getAvatarUrl(member.user);
                      const isUpdating = memberActionType === 'update' && memberActionId === member.id;
                      const isRemoving = memberActionType === 'remove' && memberActionId === member.id;
                      return (
                        <div key={`${member.user.id}-${member.role}`} className="member-row">
                          <div className="member-info">
                            <span className="member-avatar">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={memberName} />
                              ) : (
                                getInitials(memberName)
                              )}
                            </span>
                            <div>
                              <div className="member-name">{memberName}</div>
                              <div className="member-meta">{memberMeta}</div>
                            </div>
                          </div>
                          <div className="member-role">
                            {member.isOwner ? (
                              <span className="member-badge">{formatMemberRole(member.role)}</span>
                            ) : canManageMembers ? (
                              <select
                                className="input"
                                value={member.role}
                                onChange={(event) => handleUpdateMemberRole(member, event.target.value as AssignableRole)}
                                disabled={isUpdating}
                              >
                                <option value="member">{t('members.roleMember')}</option>
                                <option value="admin">{t('members.roleAdmin')}</option>
                              </select>
                            ) : (
                              <span className="member-badge">{formatMemberRole(member.role)}</span>
                            )}
                          </div>
                          <div className="member-actions">
                            {!member.isOwner && canManageMembers && (
                              <button
                                className="link danger"
                                onClick={() => handleRemoveMember(member)}
                                disabled={isRemoving}
                              >
                                {isRemoving ? t('members.removing') : t('common.delete')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                <h3 style={{ margin: 0 }}>{t('command.title')}</h3>
                <span className="toolbar-meta">Ctrl+K / Ctrl+.</span>
              </div>
              <input
                className="input"
                placeholder={t('command.placeholder')}
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                autoFocus
              />
              <div className="command-list">
                {filteredCommands.length === 0 ? (
                  <div className="empty-state">{t('command.empty')}</div>
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
