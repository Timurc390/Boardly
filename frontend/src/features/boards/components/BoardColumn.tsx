import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { type List, type Card } from '../../../types';
import { useI18n } from '../../../context/I18nContext';
import { BoardColumnView } from './board_column/BoardColumnView';
import { BoardColumnMenu } from './board_column/BoardColumnMenu';
import { getHeaderColorMeta } from './board_column/listColor';

interface BoardColumnProps {
  list: List;
  index: number;
  listIndex: number;
  listOptions: Array<{ id: number; title: string }>;
  prevList?: List | null;
  nextList?: List | null;
  isTouch?: boolean;
  canEditList?: boolean;
  canAddCards?: boolean;
  canEditCard?: (card: Card) => boolean;
  onAddCard: (listId: number, title: string) => void;
  onUpdateList: (listId: number, data: Partial<List>) => void;
  onDeleteList: (listId: number) => void;
  onCopyList?: (listId: number) => void;
  onArchiveAllCards?: (listId: number) => void;
  onCardClick: (card: Card) => void;
  onToggleCardComplete: (cardId: number, next: boolean) => void;
  onMoveList?: (listId: number, fromIndex: number, toIndex: number) => void;
  onMoveCard?: (cardId: number, sourceListId: number, destListId: number, destIndex: number) => void;
  listMenuOpen: boolean;
  onToggleListMenu: (listId: number) => void;
  onCloseListMenu: () => void;
  isCollapsed: boolean;
  onToggleCollapse: (listId: number) => void;
}

const BoardColumnComponent: React.FC<BoardColumnProps> = ({
  list,
  index,
  listIndex,
  listOptions,
  prevList,
  nextList,
  isTouch,
  canEditList = true,
  canAddCards = true,
  canEditCard,
  onAddCard,
  onUpdateList,
  onDeleteList,
  onCopyList,
  onArchiveAllCards,
  onCardClick,
  onToggleCardComplete,
  onMoveList,
  onMoveCard,
  listMenuOpen,
  onToggleListMenu,
  onCloseListMenu,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  const listMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const listMenuDropdownRef = useRef<HTMLDivElement | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const newCardInputRef = useRef<HTMLInputElement>(null);
  const isTouchViewport = Boolean(isTouch);

  const visibleCards = useMemo(
    () => (list.cards || []).filter((card) => !card.is_archived),
    [list.cards]
  );
  const visibleCount = visibleCards.length;
  const prevVisibleCount = useMemo(
    () => (prevList?.cards || []).filter((card) => !card.is_archived).length,
    [prevList?.cards]
  );
  const nextVisibleCount = useMemo(
    () => (nextList?.cards || []).filter((card) => !card.is_archived).length,
    [nextList?.cards]
  );

  const listColor = list.color?.trim() || '';
  const normalizedListColor = listColor.toLowerCase();
  const headerMeta = listColor ? getHeaderColorMeta(listColor) : null;
  const hasListColor = Boolean(headerMeta);
  const headerStyle: React.CSSProperties | undefined = headerMeta
    ? { background: listColor, color: headerMeta.text, boxShadow: `inset 0 -1px 0 ${headerMeta.divider}` }
    : undefined;
  const headerBadgeStyle: React.CSSProperties | undefined = headerMeta
    ? { background: headerMeta.badgeBg, color: headerMeta.text }
    : undefined;
  const headerIconStyle: React.CSSProperties | undefined = headerMeta
    ? { color: headerMeta.text }
    : undefined;

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleValue(list.title);
    }
  }, [isEditingTitle, list.title]);

  useEffect(() => {
    if (!isAdding || !newCardInputRef.current || isTouch) return;
    const input = newCardInputRef.current;
    const timeout = window.setTimeout(() => {
      input.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 50);
    return () => window.clearTimeout(timeout);
  }, [isAdding, isTouch]);

  const getMenuCoords = useCallback((anchor: HTMLElement | null, menuWidth = 250) => {
    if (typeof window === 'undefined' || !anchor) return null;
    const rect = anchor.getBoundingClientRect();
    const margin = 8;
    const top = Math.min(window.innerHeight - 80, Math.max(margin, rect.bottom + 6));
    const preferredLeft = rect.right - menuWidth;
    const left = Math.min(window.innerWidth - menuWidth - margin, Math.max(margin, preferredLeft));
    return { top, left };
  }, []);

  const syncListMenuCoords = useCallback(() => {
    if (isTouchViewport) return;
    setMenuCoords(getMenuCoords(listMenuTriggerRef.current));
  }, [getMenuCoords, isTouchViewport]);

  useEffect(() => {
    if (!listMenuOpen || isTouchViewport) return;
    syncListMenuCoords();
  }, [isTouchViewport, listMenuOpen, syncListMenuCoords]);

  useEffect(() => {
    if (!listMenuOpen || isTouchViewport || typeof window === 'undefined') return;
    const sync = () => syncListMenuCoords();
    window.addEventListener('resize', sync);
    window.addEventListener('scroll', sync, true);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
    };
  }, [isTouchViewport, listMenuOpen, syncListMenuCoords]);

  useEffect(() => {
    if (!listMenuOpen) {
      setMenuCoords(null);
    }
  }, [listMenuOpen]);

  useEffect(() => {
    if (!listMenuOpen || typeof document === 'undefined') return;

    const handleOutsidePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (listMenuDropdownRef.current?.contains(target)) return;
      if (listMenuTriggerRef.current?.contains(target)) return;
      onCloseListMenu();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseListMenu();
    };

    document.addEventListener('mousedown', handleOutsidePointer, true);
    document.addEventListener('touchstart', handleOutsidePointer, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer, true);
      document.removeEventListener('touchstart', handleOutsidePointer, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [listMenuOpen, onCloseListMenu]);

  const handleTitleSave = useCallback(() => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== list.title) {
      onUpdateList(list.id, { title: titleValue });
      return;
    }
    setTitleValue(list.title);
  }, [list.id, list.title, onUpdateList, titleValue]);

  const handleTitleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') handleTitleSave();
    if (event.key === 'Escape') {
      setIsEditingTitle(false);
      setTitleValue(list.title);
    }
  }, [handleTitleSave, list.title]);

  const handleSubmitCard = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddCard(list.id, newCardTitle);
    setNewCardTitle('');
    setIsAdding(false);
  }, [list.id, newCardTitle, onAddCard]);

  const handleMenuAction = useCallback((action: 'add' | 'rename' | 'copy' | 'archive' | 'archiveAllCards' | 'move' | 'moveAll' | 'remove') => {
    onCloseListMenu();

    if (action === 'add') {
      if (!canAddCards) return;
      setIsAdding(true);
      window.setTimeout(() => newCardInputRef.current?.focus(), 0);
      return;
    }

    if (action === 'rename') {
      setTitleValue(list.title);
      setIsEditingTitle(true);
      return;
    }

    if (action === 'copy' && onCopyList) {
      onCopyList(list.id);
      return;
    }

    if (action === 'archive') {
      onUpdateList(list.id, { is_archived: true });
      return;
    }

    if (action === 'archiveAllCards' && onArchiveAllCards) {
      onArchiveAllCards(list.id);
      return;
    }

    if (action === 'move' && onMoveList) {
      const nextRaw = window.prompt(t('list.menu.movePrompt'), String(listIndex + 1));
      if (!nextRaw) return;
      const nextPosition = Number(nextRaw);
      if (Number.isNaN(nextPosition)) return;
      const boundedPosition = Math.max(1, Math.min(listOptions.length, nextPosition));
      onMoveList(list.id, listIndex, boundedPosition - 1);
      return;
    }

    if (action === 'moveAll' && onMoveCard) {
      const targets = listOptions.filter((option) => option.id !== list.id);
      if (targets.length === 0 || visibleCards.length === 0) return;
      const optionsText = targets.map((option) => `${option.id}: ${option.title}`).join('\n');
      const selectedRaw = window.prompt(`${t('list.menu.moveAllPrompt')}\n${optionsText}`, String(targets[0].id));
      if (!selectedRaw) return;
      const destListId = Number(selectedRaw);
      if (Number.isNaN(destListId) || !targets.some((option) => option.id === destListId)) return;
      visibleCards.forEach((cardItem, cardIndex) => {
        onMoveCard(cardItem.id, list.id, destListId, cardIndex);
      });
      return;
    }

    if (action === 'remove') {
      onDeleteList(list.id);
    }
  }, [
    canAddCards,
    list.id,
    list.title,
    listIndex,
    listOptions,
    onArchiveAllCards,
    onCloseListMenu,
    onCopyList,
    onDeleteList,
    onMoveCard,
    onMoveList,
    onUpdateList,
    t,
    visibleCards,
  ]);

  const handleMoveListLeft = useCallback(() => {
    if (!onMoveList || !prevList) return;
    onMoveList(list.id, listIndex, listIndex - 1);
  }, [list.id, listIndex, onMoveList, prevList]);

  const handleMoveListRight = useCallback(() => {
    if (!onMoveList || !nextList) return;
    onMoveList(list.id, listIndex, listIndex + 1);
  }, [list.id, listIndex, nextList, onMoveList]);

  const handleCardClick = useCallback((cardItem: Card) => {
    onCardClick(cardItem);
  }, [onCardClick]);

  const handleToggleComplete = useCallback((cardId: number, next: boolean) => {
    onToggleCardComplete(cardId, next);
  }, [onToggleCardComplete]);

  const handleMoveCardLeft = useCallback((cardId: number) => {
    if (!onMoveCard || !prevList) return;
    onMoveCard(cardId, list.id, prevList.id, prevVisibleCount);
  }, [list.id, onMoveCard, prevList, prevVisibleCount]);

  const handleMoveCardRight = useCallback((cardId: number) => {
    if (!onMoveCard || !nextList) return;
    onMoveCard(cardId, list.id, nextList.id, nextVisibleCount);
  }, [list.id, nextList, nextVisibleCount, onMoveCard]);

  const handleMoveCardUp = useCallback((cardId: number, cardIndex: number) => {
    if (!onMoveCard) return;
    onMoveCard(cardId, list.id, list.id, cardIndex - 1);
  }, [list.id, onMoveCard]);

  const handleMoveCardDown = useCallback((cardId: number, cardIndex: number) => {
    if (!onMoveCard) return;
    onMoveCard(cardId, list.id, list.id, cardIndex + 1);
  }, [list.id, onMoveCard]);

  const handleToggleCollapse = useCallback(() => {
    onToggleCollapse(list.id);
  }, [list.id, onToggleCollapse]);

  const handleStartTitleEdit = useCallback(() => {
    if (canEditList) {
      setIsEditingTitle(true);
    }
  }, [canEditList]);

  const handleStartAddCard = useCallback(() => {
    setIsAdding(true);
  }, []);

  const handleCancelAddCard = useCallback(() => {
    setIsAdding(false);
  }, []);

  const handleToggleMenu = useCallback(() => {
    if (!listMenuOpen && !isTouchViewport) {
      setMenuCoords(getMenuCoords(listMenuTriggerRef.current));
    }
    onToggleListMenu(list.id);
  }, [getMenuCoords, isTouchViewport, list.id, listMenuOpen, onToggleListMenu]);

  const fallbackLeft = typeof window !== 'undefined' ? Math.max(8, window.innerWidth - 266) : 8;
  const resolvedMenuCoords = menuCoords ?? { top: 72, left: fallbackLeft };
  const listMenuDropdownStyle: React.CSSProperties | undefined = !isTouchViewport
    ? {
      position: 'fixed',
      top: resolvedMenuCoords.top,
      left: resolvedMenuCoords.left,
      right: 'auto',
      minWidth: 250,
      zIndex: 'var(--z-board-list-menu)',
    }
    : undefined;

  const listMenuContent = (
    <BoardColumnMenu
      canAddCards={canAddCards}
      canEditList={canEditList}
      isTouchViewport={isTouchViewport}
      listColor={listColor}
      normalizedListColor={normalizedListColor}
      onClose={onCloseListMenu}
      onMenuAction={handleMenuAction}
      onPickColor={(color) => onUpdateList(list.id, { color })}
      onClearColor={() => onUpdateList(list.id, { color: '' })}
      dropdownRef={listMenuDropdownRef}
      dropdownStyle={listMenuDropdownStyle}
      t={t}
    />
  );

  return (
    <BoardColumnView
      list={list}
      index={index}
      isCollapsed={isCollapsed}
      canEditList={canEditList}
      canAddCards={canAddCards}
      isTouch={isTouch}
      prevList={prevList}
      nextList={nextList}
      visibleCards={visibleCards}
      visibleCount={visibleCount}
      hasListColor={hasListColor}
      listColor={listColor}
      headerMeta={headerMeta}
      headerStyle={headerStyle}
      headerBadgeStyle={headerBadgeStyle}
      headerIconStyle={headerIconStyle}
      isEditingTitle={isEditingTitle}
      titleValue={titleValue}
      setTitleValue={setTitleValue}
      onTitleSave={handleTitleSave}
      onTitleKeyDown={handleTitleKeyDown}
      onStartTitleEdit={handleStartTitleEdit}
      titleInputRef={titleInputRef}
      listMenuOpen={listMenuOpen}
      listMenuTriggerRef={listMenuTriggerRef}
      onToggleMenu={handleToggleMenu}
      listMenuContent={listMenuContent}
      onToggleCollapse={handleToggleCollapse}
      isAdding={isAdding}
      newCardTitle={newCardTitle}
      setNewCardTitle={setNewCardTitle}
      onSubmitCard={handleSubmitCard}
      onStartAddCard={handleStartAddCard}
      onCancelAddCard={handleCancelAddCard}
      newCardInputRef={newCardInputRef}
      onCardClick={handleCardClick}
      onToggleCardComplete={handleToggleComplete}
      canEditCard={canEditCard}
      onMoveCardLeft={handleMoveCardLeft}
      onMoveCardRight={handleMoveCardRight}
      onMoveCardUp={handleMoveCardUp}
      onMoveCardDown={handleMoveCardDown}
      onMoveListLeft={handleMoveListLeft}
      onMoveListRight={handleMoveListRight}
      t={t}
    />
  );
};

export const BoardColumn = React.memo(BoardColumnComponent);
