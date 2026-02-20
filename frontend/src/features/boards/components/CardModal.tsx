import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Card, Board, User } from '../../../types';
import { API_URL } from '../../../api/client';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { CardHeader } from './card_parts/CardHeader';
import { CardDescription } from './card_parts/CardDescription';
import { CardChecklists } from './card_parts/CardChecklists';
import { CardComments } from './card_parts/CardComments';

import { useAppSelector } from '../../../store/hooks';
import { useI18n } from '../../../context/I18nContext';

interface CardModalProps {
  card: Card;
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onUpdateCard: (data: Partial<Card>) => void;
  onDeleteCard: () => void;
  onCopyCard: () => void;
  onMoveCard?: (cardId: number, sourceListId: number, destListId: number, destIndex: number) => void;
  onAddChecklist: (title: string) => Promise<{ id?: number } | null | void> | { id?: number } | null | void;
  onDeleteChecklist: (checklistId: number) => Promise<any> | void;
  onAddChecklistItem: (checklistId: number, text: string) => Promise<any> | void;
  onDeleteChecklistItem: (itemId: number, checklistId?: number) => Promise<any> | void;
  onToggleChecklistItem: (itemId: number, isChecked: boolean) => Promise<any> | void;
  onUpdateChecklistItem: (itemId: number, text: string) => Promise<any> | void;
  onAddComment: (text: string) => void;
  onUpdateComment: (commentId: number, text: string) => void;
  onDeleteComment: (commentId: number) => void;
  onUpdateLabels: (labelIds: number[]) => void;
  onCreateLabel: (name: string, color: string) => Promise<{ id?: number } | void> | void;
  onUpdateLabel: (id: number, name: string, color: string) => void;
  onDeleteLabel: (id: number) => void;
  onJoinCard: () => void;
  onLeaveCard: () => void;
  onRemoveMember: (userId: number) => void;
  onAddMember: (userId: number) => void;
  onAddAttachment: (file: File) => Promise<void> | void;
  onDeleteAttachment: (attachmentId: number) => void;
}

const formatDateForInput = (isoString?: string | null) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const COLORBLIND_STORAGE_KEY = 'boardly_card_colorblind_mode';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
};

const COLORBLIND_COVER_MAP: Record<string, string> = {
  '#216e4e': '#1d70b8',
  '#7f5f01': '#b26a00',
  '#9e4c00': '#8b3fb9',
  '#ae2e24': '#005ea5',
  '#803fa5': '#b25d00',
  '#1558bc': '#006b6b',
  '#206a83': '#5f3dc4',
  '#4c6b1f': '#0b7a75',
  '#943d73': '#7a2b8f',
  '#63666b': '#2b6cb0'
};

export const CardModal: React.FC<CardModalProps> = ({ 
  card, board, isOpen, onClose, 
  onCopyLink, onUpdateCard, onDeleteCard, onCopyCard,
  onMoveCard,
  onAddChecklist, onDeleteChecklist, onAddChecklistItem, onDeleteChecklistItem, onToggleChecklistItem, onUpdateChecklistItem, onAddComment,
  onUpdateComment, onDeleteComment,
  onUpdateLabels, onCreateLabel, onUpdateLabel, onDeleteLabel,
  onJoinCard, onLeaveCard, onRemoveMember, onAddMember, onAddAttachment, onDeleteAttachment
}) => {
  const { user } = useAppSelector(state => state.auth);
  const { t } = useI18n();
  
  const [dueDateDate, setDueDateDate] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [isColorblindMode, setIsColorblindMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLORBLIND_STORAGE_KEY) === '1';
  });
  const [activePopover, setActivePopover] = useState<'labels' | 'members' | 'attachments' | 'checklist' | 'dueDate' | null>(null);
  const [labelQuery, setLabelQuery] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#61bd4f');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [checklistCopyFromId, setChecklistCopyFromId] = useState<number | null>(null);
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
  const [addChecklistItemSignal, setAddChecklistItemSignal] = useState(0);
  const [headerCloseSignal, setHeaderCloseSignal] = useState(0);
  const checklistsSectionRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const mainColRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const [commentsMaxHeight, setCommentsMaxHeight] = useState<number | null>(null);
  const labelColorOptions = [
    '#61bd4f',
    '#f2d600',
    '#ff9f1a',
    '#eb5a46',
    '#c377e0',
    '#0079bf',
    '#00c2e0',
    '#51e898',
    '#ff78cb',
    '#344563'
  ];
  const coverColorOptions = [
    '#4CAF50',
    '#FBC02D',
    '#E53935',
    '#1E88E5',
    '#9E9E9E',
    '#F5F5F5',
    '#FB8C00',
    '#8E24AA',
    '#00897B',
    '#8D6E63'
  ];

  const membership = board.members?.find(m => m.user.id === user?.id);
  const role = membership?.role;
  const isOwner = board.owner?.id === user?.id;
  const isAdmin = role === 'admin';
  const isDeveloper = role === 'developer';
  const isViewer = role === 'viewer';
  const isCardMember = card.members?.some(u => u.id === user?.id);
  const developerCanEdit = board.dev_can_edit_assigned_cards ?? true;
  const developerCanArchive = board.dev_can_archive_assigned_cards ?? true;
  const developerCanJoin = board.dev_can_join_card ?? true;
  const canEditCard = !!(isOwner || isAdmin || (isDeveloper && developerCanEdit && isCardMember));
  const canArchiveCard = !!(isOwner || isAdmin || (isDeveloper && developerCanArchive && isCardMember));
  const canDeleteCard = !!(isOwner || isAdmin);
  const canManageMembers = !!(isOwner || isAdmin);
  const canJoinCard = !!(canManageMembers || (isDeveloper && developerCanJoin));
  const canLeaveCard = !!isCardMember;
  const canComment = !!(isOwner || isAdmin || isDeveloper || isViewer);
  const quickActionsDisabled = !(canEditCard || isOwner || isAdmin || isDeveloper);
  const coverColor = card.card_color?.trim();
  const hasCover = !!coverColor;
  const coverMode = card.cover_size === 'full' ? 'full' : 'header';

  const resolveCoverColor = (color?: string | null) => {
    const normalized = (color || '').trim().toLowerCase();
    if (!normalized) return color || '';
    if (!isColorblindMode) return color || normalized;
    return COLORBLIND_COVER_MAP[normalized] || color || normalized;
  };
  const displayCoverColor = resolveCoverColor(coverColor);

  useEffect(() => {
    if (!isOpen) {
      setIsCommentsOpen(false);
      setIsCoverMenuOpen(false);
      setActivePopover(null);
      return;
    }
    lastActiveElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
      lastActiveElementRef.current?.focus();
      lastActiveElementRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;
    const raf = window.requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(dialogNode);
      (firstFocusable || dialogNode).focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const dialogNode = dialogRef.current;
      const focusable = getFocusableElements(dialogNode);
      if (!focusable.length) {
        event.preventDefault();
        dialogNode?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const hasOpenPopover = isCoverMenuOpen || !!activePopover;
    if (!hasOpenPopover) return;

    const handleClickOutsidePopover = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const interactiveSelector = [
        '.card-add-popover',
        '.card-detail-popover',
        '.card-cover-menu',
        '.card-comments-launch',
        '.card-comments-col',
        '.card-comments-panel',
        '.card-quick-btn',
        '.card-header-icon',
        '.card-list-pill',
        '.card-menu-dropdown',
        '.card-menu-trigger',
        '.checklist-create-popover .btn-primary'
      ].join(', ');

      if (target.closest(interactiveSelector)) return;

      setIsCoverMenuOpen(false);
      setActivePopover(null);
    };

    document.addEventListener('mousedown', handleClickOutsidePopover);
    document.addEventListener('touchstart', handleClickOutsidePopover);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsidePopover);
      document.removeEventListener('touchstart', handleClickOutsidePopover);
    };
  }, [activePopover, isCoverMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COLORBLIND_STORAGE_KEY, isColorblindMode ? '1' : '0');
  }, [isColorblindMode]);

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
  }, [isOpen, card.id, card.comments?.length, card.checklists?.length, isCommentsOpen]);

  const closeAllCardOverlays = useCallback((options: { keepComments?: boolean; keepCover?: boolean; keepHeaderMenus?: boolean } = {}) => {
    if (!options.keepCover) {
      setIsCoverMenuOpen(false);
    }
    setActivePopover(null);
    if (!options.keepComments) {
      setIsCommentsOpen(false);
    }
    if (!options.keepHeaderMenus) {
      setHeaderCloseSignal((value) => value + 1);
    }
  }, []);

  const startEditingDueDate = () => {
    closeAllCardOverlays();
    const formatted = formatDateForInput(card.due_date);
    if (formatted) {
      const [datePart, timePart] = formatted.split('T');
      setDueDateDate(datePart || '');
      setDueDateTime(timePart || '');
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setDueDateDate(`${year}-${month}-${day}`);
      setDueDateTime(`${hours}:${minutes}`);
    }
    setActivePopover('dueDate');
  };

  const saveDueDate = () => {
    if (!dueDateDate) {
      window.alert(t('card.dueDateRequired'));
      return;
    }
    const time = dueDateTime || '12:00';
    const date = new Date(`${dueDateDate}T${time}`);
    onUpdateCard({ due_date: date.toISOString(), is_completed: false });
    setActivePopover(null);
  };

  const removeDueDate = () => {
    onUpdateCard({ due_date: null, is_completed: false });
    setDueDateDate('');
    setDueDateTime('');
    setActivePopover(null);
  };

  const handleCoverModeChange = (mode: 'full' | 'header') => {
    if (!card.card_color) {
      onUpdateCard({ cover_size: mode, card_color: '#4CAF50' });
      return;
    }
    onUpdateCard({ cover_size: mode });
  };

  const getNextChecklistTitle = () => {
    const base = t('checklist.title');
    const taken = new Set(
      (card.checklists || [])
        .map(checklist => (checklist.title || '').trim().toLowerCase())
        .filter(Boolean)
    );
    if (!taken.has(base.toLowerCase())) return base;
    let index = 2;
    let candidate = `${base} ${index}`;
    while (taken.has(candidate.toLowerCase())) {
      index += 1;
      candidate = `${base} ${index}`;
    }
    return candidate;
  };

  const openCoverMenu = () => {
    closeAllCardOverlays({ keepComments: true, keepCover: true });
    setIsCoverMenuOpen(prev => !prev);
  };

  const openChecklistPopover = () => {
    closeAllCardOverlays();
    setActivePopover('checklist');
    setNewChecklistTitle(getNextChecklistTitle());
    setChecklistCopyFromId(null);
  };

  const handleToggleComments = () => {
    setIsCommentsOpen((prev) => {
      const next = !prev;
      if (next) {
        setActivePopover(null);
        setHeaderCloseSignal((value) => value + 1);
      }
      return next;
    });
  };
  const hasChecklists = (card.checklists || []).length > 0;

  const labelIds = useMemo(() => new Set((card.labels || []).map(l => l.id)), [card.labels]);
  const isLabelsOpen = activePopover === 'labels';
  const isMembersOpen = activePopover === 'members';
  const isDueDateOpen = activePopover === 'dueDate';
  const filteredLabels = useMemo(() => {
    if (!isLabelsOpen) return [];
    const q = labelQuery.trim().toLowerCase();
    if (!q) return board.labels || [];
    return (board.labels || []).filter(label => label.name.toLowerCase().includes(q));
  }, [board.labels, isLabelsOpen, labelQuery]);

  const cardMembers = useMemo(() => {
    if (!isMembersOpen) return [];
    return card.members || [];
  }, [card.members, isMembersOpen]);

  const filteredMembers = useMemo(() => {
    if (!isMembersOpen) return [];
    const q = memberQuery.trim().toLowerCase();
    if (!q) return cardMembers;
    return cardMembers.filter(member => {
      const text = `${member.first_name || ''} ${member.last_name || ''} ${member.username || ''} ${member.email || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [cardMembers, isMembersOpen, memberQuery]);

  const handleToggleLabel = (labelId: number) => {
    if (!canEditCard) return;
    const currentIds = (card.labels || []).map(l => l.id);
    const nextIds = currentIds.includes(labelId)
      ? currentIds.filter(id => id !== labelId)
      : [...currentIds, labelId];
    onUpdateLabels(nextIds);
  };

  const handleCreateLabel = async () => {
    const name = newLabelName.trim();
    if (!name) return;
    await onCreateLabel(name, newLabelColor);
    setNewLabelName('');
    setNewLabelColor('#61bd4f');
  };

  const handleAttachmentUpload = async (file?: File) => {
    if (!file || isUploadingAttachment) return;
    setIsUploadingAttachment(true);
    try {
      await onAddAttachment(file);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const resolveApiOrigin = useCallback(() => {
    if (/^https?:\/\//i.test(API_URL)) {
      return new URL(API_URL).origin;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return window.location.origin;
  }, []);

  const resolveAttachmentUrl = useCallback((filePath?: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
      return filePath;
    }
    const apiOrigin = resolveApiOrigin();
    if (filePath.startsWith('/')) {
      return `${apiOrigin}${filePath}`;
    }
    return `${apiOrigin}/${filePath.replace(/^\.?\//, '')}`;
  }, [resolveApiOrigin]);

  const handleCreateChecklist = async () => {
    if (isCreatingChecklist) return;
    const title = newChecklistTitle.trim() || t('checklist.title');
    setIsCreatingChecklist(true);
    try {
      const created = await onAddChecklist(title);
      const createdId = typeof created === 'object' && created && 'id' in created ? Number(created.id) : NaN;
      if (!Number.isFinite(createdId)) return;

      if (checklistCopyFromId) {
        const sourceChecklist = (card.checklists || []).find(checklist => checklist.id === checklistCopyFromId);
        if (sourceChecklist?.items?.length) {
          for (const sourceItem of sourceChecklist.items) {
            const text = sourceItem.text?.trim();
            if (!text) continue;
            const createdItem = await onAddChecklistItem(createdId, text);
            const createdItemId = typeof createdItem === 'object' && createdItem && 'id' in createdItem
              ? Number((createdItem as { id?: number }).id)
              : NaN;
            if (sourceItem.is_checked && Number.isFinite(createdItemId)) {
              await onToggleChecklistItem(createdItemId, true);
            }
          }
        }
      }

      setActivePopover(null);
      setNewChecklistTitle('');
      setChecklistCopyFromId(null);
      window.setTimeout(() => checklistsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
    } finally {
      setIsCreatingChecklist(false);
    }
  };

  const modalClassName = `modal-content card-modal ${hasCover ? `has-cover cover-${coverMode}` : ''} ${isColorblindMode ? 'colorblind' : ''}`;
  const mainCardStyle = useMemo<React.CSSProperties>(
    () => ({ ['--open-card-cover' as any]: displayCoverColor || '#2e79af' }),
    [displayCoverColor]
  );
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay card-modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className={modalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        {hasCover && (
          <div className="card-cover-bar" style={{ background: displayCoverColor }} />
        )}

        <div className={`card-modal-body ${isCoverMenuOpen ? 'has-cover-menu' : ''} ${isCommentsOpen ? 'has-comments' : ''}`}>
          {isCoverMenuOpen && (
            <div className="card-cover-menu card-cover-floating">
              <div className="card-cover-menu-header">
                <span className="card-popover-title">{t('card.cover.title')}</span>
                <button
                  type="button"
                  className="btn-icon card-popover-close"
                  onClick={() => setIsCoverMenuOpen(false)}
                  aria-label={t('common.close')}
                >
                  ✕
                </button>
              </div>
              <div className="card-cover-section">
                <div className="card-cover-section-title">{t('card.cover.size')}</div>
                <div className="card-cover-size-options">
                  <button
                    type="button"
                    className={`card-cover-size ${coverMode === 'full' ? 'active' : ''}`}
                    onClick={() => handleCoverModeChange('full')}
                  >
                    <span className="card-cover-preview full" style={{ background: resolveCoverColor(card.card_color || '#6d6d6d') }} />
                    <span className="card-cover-size-label">{t('card.cover.size.full')}</span>
                  </button>
                  <button
                    type="button"
                    className={`card-cover-size ${coverMode === 'header' ? 'active' : ''}`}
                    onClick={() => handleCoverModeChange('header')}
                  >
                    <span className="card-cover-preview header" style={{ background: resolveCoverColor(card.card_color || '#6d6d6d') }} />
                    <span className="card-cover-size-label">{t('card.cover.size.header')}</span>
                  </button>
                </div>
              </div>
              <div className="card-cover-section">
                <div className="card-cover-section-title">{t('card.cover.colors')}</div>
                <div className="card-cover-swatches card-cover-swatches-wide">
                  {coverColorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`card-cover-swatch ${card.card_color === color ? 'active' : ''}`}
                      style={{ background: resolveCoverColor(color) }}
                      onClick={() => onUpdateCard({ card_color: color })}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className={`card-cover-accessibility ${isColorblindMode ? 'active' : ''}`}
                onClick={() => setIsColorblindMode(prev => !prev)}
              >
                {isColorblindMode ? t('card.cover.colorblind.disable') : t('card.cover.colorblind.enable')}
              </button>
            </div>
          )}
          <div className="card-main-col" style={mainCardStyle} ref={mainColRef}>
            <CardHeader
              card={card}
              board={board}
              canEdit={canEditCard}
              onUpdateCard={onUpdateCard}
              onCopyLink={onCopyLink}
              onCopyCard={onCopyCard}
              onArchiveToggle={() => { if (canArchiveCard) onUpdateCard({ is_archived: !card.is_archived }); }}
              onDeleteCard={() => { if (canDeleteCard) { onDeleteCard(); onClose(); } }}
              onMoveCard={onMoveCard}
              isCardMember={isCardMember}
              onJoinCard={() => { if (canJoinCard) onJoinCard(); }}
              onLeaveCard={() => { if (canLeaveCard) onLeaveCard(); }}
              onOpenCover={openCoverMenu}
              closeSignal={headerCloseSignal}
              onOpenHeaderMenu={() => {
                closeAllCardOverlays({ keepComments: true, keepCover: true, keepHeaderMenus: true });
              }}
              onClose={onClose}
            />
            <div className="card-quick-actions">
              <button
                type="button"
                className={`card-quick-btn ${isLabelsOpen ? 'active' : ''}`}
                onClick={() => {
                  closeAllCardOverlays();
                  setActivePopover('labels');
                }}
                disabled={quickActionsDisabled}
              >
                <span className="card-quick-icon">🏷</span>
                {t('card.add.labels')}
              </button>
              <button type="button" className={`card-quick-btn ${isDueDateOpen ? 'active' : ''}`} onClick={startEditingDueDate} disabled={quickActionsDisabled}>
                <span className="card-quick-icon">◷</span>
                {t('card.quick.dates')}
              </button>
              <button
                type="button"
                className={`card-quick-btn ${activePopover === 'attachments' ? 'active' : ''}`}
                onClick={() => {
                  closeAllCardOverlays();
                  setActivePopover('attachments');
                }}
              >
                <span className="card-quick-icon">📎</span>
                {t('card.add.attachments')}
              </button>
              <button
                type="button"
                className="card-quick-btn"
                onClick={() => {
                  closeAllCardOverlays();
                  setActivePopover('members');
                }}
                disabled={quickActionsDisabled}
              >
                <span className="card-quick-icon">👥</span>
                {t('card.quick.members')}
              </button>
            </div>
            {activePopover === 'labels' && (
              <div className="card-detail-popover">
                <div className="card-popover-header">
                  <div className="card-popover-title">{t('card.add.labels')}</div>
                  <button
                    type="button"
                    className="btn-icon card-popover-close"
                    onClick={() => setActivePopover(null)}
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>
                <input
                  className="form-input card-popover-search"
                  placeholder={`${t('common.search')}...`}
                  value={labelQuery}
                  onChange={e => setLabelQuery(e.target.value)}
                />
                <div className="card-popover-list">
                  {filteredLabels.length === 0 && (
                    <div className="empty-state">{t('labels.empty')}</div>
                  )}
                  {filteredLabels.map(label => (
                    <div key={label.id} className="card-popover-row">
                      <button
                        type="button"
                        className={`card-popover-item ${labelIds.has(label.id) ? 'active' : ''}`}
                        onClick={() => handleToggleLabel(label.id)}
                      >
                        <span className="card-popover-check">{labelIds.has(label.id) ? '✓' : ''}</span>
                        <span className="label-chip" style={{ background: label.color }}>{label.name}</span>
                      </button>
                      {canEditCard && (
                        <button
                          type="button"
                          className="btn-icon card-popover-delete"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                          onClick={() => {
                            if (window.confirm(t('labels.deleteConfirm'))) {
                              onDeleteLabel(label.id);
                            }
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="card-popover-footer">
                  <div className="card-label-color-grid">
                    {labelColorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`card-label-color-btn ${newLabelColor === color ? 'active' : ''}`}
                        style={{ background: color }}
                        onClick={() => setNewLabelColor(color)}
                        aria-label={color}
                      />
                    ))}
                  </div>
                  <input
                    className="form-input"
                    placeholder={t('labels.newPlaceholder')}
                    value={newLabelName}
                    onChange={e => setNewLabelName(e.target.value)}
                  />
                  <button type="button" className="btn-secondary btn-sm" onClick={handleCreateLabel}>
                    {t('labels.add')}
                  </button>
                </div>
              </div>
            )}
            {activePopover === 'checklist' && (
              <div className="card-detail-popover checklist-create-popover">
                <div className="checklist-create-header">
                  <div className="card-popover-title">{t('checklist.createPopoverTitle')}</div>
                  <button
                    type="button"
                    className="btn-icon checklist-create-close"
                    onClick={() => setActivePopover(null)}
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>

                <label className="checklist-create-field">
                  <span className="checklist-create-label">{t('checklist.nameLabel')}</span>
                  <input
                    className="form-input"
                    value={newChecklistTitle}
                    onChange={e => setNewChecklistTitle(e.target.value)}
                    placeholder={t('checklist.nameLabel')}
                    autoFocus
                  />
                </label>

                <label className="checklist-create-field">
                  <span className="checklist-create-label">{t('checklist.copy.fromLabel')}</span>
                  <select
                    className="form-input"
                    value={checklistCopyFromId ?? ''}
                    onChange={e => {
                      const next = e.target.value ? Number(e.target.value) : null;
                      setChecklistCopyFromId(Number.isNaN(next) ? null : next);
                    }}
                  >
                    <option value="">{t('checklist.copy.none')}</option>
                    {(card.checklists || []).map(checklist => (
                      <option key={checklist.id} value={checklist.id}>
                        {checklist.title || `${t('checklist.title')} #${checklist.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => { void handleCreateChecklist(); }}
                  disabled={isCreatingChecklist}
                >
                  {isCreatingChecklist ? `${t('common.loading')}...` : t('common.add')}
                </button>
              </div>
            )}
            {isDueDateOpen && (
              <div className="card-detail-popover card-due-date-popover">
                <div className="card-popover-header">
                  <div className="card-popover-title">{t('card.dueDate')}</div>
                  <button
                    type="button"
                    className="btn-icon card-popover-close"
                    onClick={() => setActivePopover(null)}
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>
                <label className="checklist-create-field">
                  <span className="checklist-create-label">{t('card.dueDate')}</span>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDateDate}
                    onChange={e => setDueDateDate(e.target.value)}
                  />
                </label>
                <label className="checklist-create-field">
                  <span className="checklist-create-label">{t('card.quick.dates')}</span>
                  <input
                    type="time"
                    className="form-input"
                    value={dueDateTime}
                    onChange={e => setDueDateTime(e.target.value)}
                  />
                </label>
                <div className="card-due-date-actions">
                  <button type="button" className="btn-primary btn-sm" onClick={saveDueDate}>
                    {t('common.save')}
                  </button>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setActivePopover(null)}>
                    {t('common.cancel')}
                  </button>
                  <button type="button" className="btn-secondary btn-sm" onClick={removeDueDate}>
                    {t('card.dueDateRemove')}
                  </button>
                </div>
              </div>
            )}
            {activePopover === 'members' && (
              <div className="card-detail-popover card-members-popover">
                <div className="card-popover-header">
                  <div className="card-popover-title">{t('members.addListTitle')}</div>
                  <button
                    type="button"
                    className="btn-icon card-popover-close"
                    onClick={() => setActivePopover(null)}
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>
                <input
                  className="form-input card-popover-search card-members-popover-search"
                  placeholder={t('members.searchParticipants')}
                  value={memberQuery}
                  onChange={e => setMemberQuery(e.target.value)}
                />
                <div className="card-members-popover-section-title">{t('card.quick.members')}</div>
                <div className="card-popover-list card-members-popover-list">
                  {filteredMembers.map(member => {
                    const label = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username || member.email;
                    const initial = (label?.[0] || '?').toUpperCase();
                    const rawAvatar = member.profile?.avatar_url || member.profile?.avatar || '';
                    const avatarSrc = resolveMediaUrl(rawAvatar);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        className="card-popover-item card-members-popover-item active"
                        onClick={() => {
                          if (!canManageMembers) return;
                          onRemoveMember(member.id);
                        }}
                      >
                        <span className="card-popover-avatar card-members-popover-avatar">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={label}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=525867&color=ffffff&size=64`;
                              }}
                            />
                          ) : (
                            initial
                          )}
                        </span>
                        <div className="card-popover-member">
                          <div className="card-popover-member-name">{label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {activePopover === 'attachments' && (
              <div className="card-detail-popover">
                <div className="card-popover-header">
                  <div className="card-popover-title">{t('attachments.title')}</div>
                  <button
                    type="button"
                    className="btn-icon card-popover-close"
                    onClick={() => setActivePopover(null)}
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>
                <label className="card-attachment-upload">
                  <input
                    type="file"
                    onChange={e => handleAttachmentUpload(e.target.files?.[0])}
                    disabled={!canEditCard || isUploadingAttachment}
                  />
                  <span>{t('attachments.add')}</span>
                </label>
                <div className="card-popover-list">
                  {(card.attachments || []).length === 0 && (
                    <div className="empty-state">{t('attachments.empty')}</div>
                  )}
                  {(card.attachments || []).map(att => {
                    const fileName = att.file?.split('/').pop() || att.name || t('attachments.title');
                    const fileUrl = resolveAttachmentUrl(att.file);
                    return (
                      <div key={att.id} className="card-attachment-row">
                        <a
                          className="card-attachment-name card-attachment-link"
                          href={fileUrl || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!fileUrl) e.preventDefault();
                          }}
                          title={fileName}
                        >
                          {fileName}
                        </a>
                        <div className="card-attachment-actions">
                          <a
                            className="btn-secondary btn-sm card-attachment-open"
                            href={fileUrl || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!fileUrl) e.preventDefault();
                            }}
                            aria-label={fileName}
                            title={fileName}
                          >
                            ↗
                          </a>
                          {canEditCard && (
                            <button
                              type="button"
                              className="btn-secondary btn-sm"
                              onClick={() => onDeleteAttachment(att.id)}
                            >
                              {t('common.delete')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <CardDescription 
              card={card} 
              canEdit={canEditCard} 
              onUpdateCard={onUpdateCard} 
            />

            <div ref={checklistsSectionRef}>
              <CardChecklists 
                card={card} 
                canEdit={canEditCard} 
                onDeleteChecklist={onDeleteChecklist}
                onAddChecklistItem={onAddChecklistItem} 
                onDeleteChecklistItem={onDeleteChecklistItem}
                onToggleChecklistItem={onToggleChecklistItem} 
                onUpdateChecklistItem={onUpdateChecklistItem}
                openAddItemSignal={addChecklistItemSignal}
              />
            </div>
            <div className="card-main-footer">
              <button
                type="button"
                className="checklist-add-trigger"
                onClick={() => setAddChecklistItemSignal((v) => v + 1)}
                disabled={!canEditCard || !hasChecklists}
              >
                + {t('checklist.addItem')}
              </button>
              <button
                type="button"
                className={`card-comments-launch ${isCommentsOpen ? 'active' : ''}`}
                onClick={handleToggleComments}
              >
                <span className="card-comments-launch-icon">💬</span>
                <span>{t('comments.title')}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {isCommentsOpen && (
            <div className="card-comments-col" style={commentsMaxHeight ? { maxHeight: `${commentsMaxHeight}px` } : undefined}>
              <CardComments
                card={card}
                user={user}
                onAddComment={onAddComment}
                onUpdateComment={onUpdateComment}
                onDeleteComment={onDeleteComment}
                canEditComment={(comment) => comment.author?.id === user?.id}
                canDeleteComment={() => canDeleteCard}
                canEdit={canComment}
                onClose={() => setIsCommentsOpen(false)}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
