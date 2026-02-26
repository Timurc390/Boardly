import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Card, type User } from '../../../types';
import { useDialogA11y } from '../../../shared/hooks/useDialogA11y';

export type CardPopover = 'labels' | 'members' | 'attachments' | 'checklist' | 'dueDate' | null;

const COLORBLIND_STORAGE_KEY = 'boardly_card_colorblind_mode';

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

type UseCardModalStateParams = {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
  boardMembers: User[];
  boardLabels: Array<{ id: number; name: string; color: string }>;
  onUpdateCard: (data: Partial<Card>) => void;
  canEditCard: boolean;
  closeComments: () => void;
  requireDueDateMessage: string;
};

export const useCardModalState = ({
  isOpen,
  onClose,
  card,
  boardMembers,
  boardLabels,
  onUpdateCard,
  canEditCard,
  closeComments,
  requireDueDateMessage,
}: UseCardModalStateParams) => {
  const [dueDateDate, setDueDateDate] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [isColorblindMode, setIsColorblindMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLORBLIND_STORAGE_KEY) === '1';
  });
  const [activePopover, setActivePopover] = useState<CardPopover>(null);
  const [labelQuery, setLabelQuery] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#61bd4f');
  const [headerCloseSignal, setHeaderCloseSignal] = useState(0);
  const [addChecklistItemSignal, setAddChecklistItemSignal] = useState(0);

  const checklistsSectionRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsCoverMenuOpen(false);
      setActivePopover(null);
      return;
    }
    document.body.classList.add('modal-open');

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useDialogA11y({ isOpen, onClose, dialogRef });

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
        '.checklist-create-popover .btn-primary',
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

  const closeAllCardOverlays = useCallback((options: { keepComments?: boolean; keepCover?: boolean; keepHeaderMenus?: boolean } = {}) => {
    if (!options.keepCover) {
      setIsCoverMenuOpen(false);
    }
    setActivePopover(null);
    if (!options.keepComments) {
      closeComments();
    }
    if (!options.keepHeaderMenus) {
      setHeaderCloseSignal((value) => value + 1);
    }
  }, [closeComments]);

  const startEditingDueDate = useCallback(() => {
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
  }, [card.due_date, closeAllCardOverlays]);

  const saveDueDate = useCallback(() => {
    if (!dueDateDate) {
      window.alert(requireDueDateMessage);
      return;
    }

    const time = dueDateTime || '12:00';
    const date = new Date(`${dueDateDate}T${time}`);
    onUpdateCard({ due_date: date.toISOString(), is_completed: false });
    setActivePopover(null);
  }, [dueDateDate, dueDateTime, onUpdateCard, requireDueDateMessage]);

  const removeDueDate = useCallback(() => {
    onUpdateCard({ due_date: null, is_completed: false });
    setDueDateDate('');
    setDueDateTime('');
    setActivePopover(null);
  }, [onUpdateCard]);

  const handleCoverModeChange = useCallback((mode: 'full' | 'header') => {
    if (!card.card_color) {
      onUpdateCard({ cover_size: mode, card_color: '#4CAF50' });
      return;
    }
    onUpdateCard({ cover_size: mode });
  }, [card.card_color, onUpdateCard]);

  const openCoverMenu = useCallback(() => {
    closeAllCardOverlays({ keepComments: true, keepCover: true });
    setIsCoverMenuOpen((prev) => !prev);
  }, [closeAllCardOverlays]);

  const labelIds = useMemo(() => new Set((card.labels || []).map((label) => label.id)), [card.labels]);
  const isLabelsOpen = activePopover === 'labels';
  const isMembersOpen = activePopover === 'members';
  const isDueDateOpen = activePopover === 'dueDate';

  const filteredLabels = useMemo(() => {
    if (!isLabelsOpen) return [];
    const query = labelQuery.trim().toLowerCase();
    if (!query) return boardLabels;
    return boardLabels.filter((label) => label.name.toLowerCase().includes(query));
  }, [boardLabels, isLabelsOpen, labelQuery]);

  const selectableMembers = useMemo(() => {
    if (!isMembersOpen) return [];
    return boardMembers;
  }, [boardMembers, isMembersOpen]);

  const filteredMembers = useMemo(() => {
    if (!isMembersOpen) return [];
    const query = memberQuery.trim().toLowerCase();
    if (!query) return selectableMembers;
    return selectableMembers.filter((member: User) => {
      const text = `${member.first_name || ''} ${member.last_name || ''} ${member.username || ''} ${member.email || ''}`.toLowerCase();
      return text.includes(query);
    });
  }, [selectableMembers, isMembersOpen, memberQuery]);

  const handleToggleLabel = useCallback((labelId: number, onUpdateLabels: (labelIds: number[]) => void) => {
    if (!canEditCard) return;
    const currentIds = (card.labels || []).map((label) => label.id);
    const nextIds = currentIds.includes(labelId)
      ? currentIds.filter((id) => id !== labelId)
      : [...currentIds, labelId];
    onUpdateLabels(nextIds);
  }, [canEditCard, card.labels]);

  const hasChecklists = (card.checklists || []).length > 0;

  return {
    dueDateDate,
    setDueDateDate,
    dueDateTime,
    setDueDateTime,
    isCoverMenuOpen,
    setIsCoverMenuOpen,
    isColorblindMode,
    setIsColorblindMode,
    activePopover,
    setActivePopover,
    labelQuery,
    setLabelQuery,
    memberQuery,
    setMemberQuery,
    newLabelName,
    setNewLabelName,
    newLabelColor,
    setNewLabelColor,
    headerCloseSignal,
    addChecklistItemSignal,
    setAddChecklistItemSignal,
    checklistsSectionRef,
    dialogRef,
    closeAllCardOverlays,
    startEditingDueDate,
    saveDueDate,
    removeDueDate,
    handleCoverModeChange,
    openCoverMenu,
    labelIds,
    isLabelsOpen,
    isMembersOpen,
    isDueDateOpen,
    filteredLabels,
    filteredMembers,
    handleToggleLabel,
    hasChecklists,
  };
};
