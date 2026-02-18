import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { List, Card } from '../../../types';
import { CardItem } from './CardItem';
import { Button } from '../../../components/ui/Button';
import { useI18n } from '../../../context/I18nContext';

const LIST_COLOR_OPTIONS = [
  '#AC7575',
  '#334132',
  '#2E315C',
  '#A8285B',
  '#D8C246',
  '#5B7BFA',
  '#F08A5D',
  '#22344C',
  '#2E2E2E',
  '#E8DDC7'
];

const hexToRgb = (hex: string) => {
  const raw = hex.replace('#', '').trim();
  if (!raw) return null;
  const normalized = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw;
  if (normalized.length !== 6) return null;
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return null;
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255
  ] as const;
};

const getHeaderColorMeta = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const isLight = luminance > 0.6;
  return {
    text: isLight ? '#1f2937' : '#f8fafc',
    badgeBg: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)',
    divider: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.22)'
  };
};

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
  onToggleCollapse
}) => {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(true);
  const listMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const listMenuDropdownRef = useRef<HTMLDivElement | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const newCardInputRef = useRef<HTMLInputElement>(null);
  const isTouchViewport = !!isTouch;

  const visibleCards = useMemo(
    () => (list.cards || []).filter(card => !card.is_archived),
    [list.cards]
  );
  const visibleCount = visibleCards.length;
  const prevVisibleCount = useMemo(
    () => (prevList?.cards || []).filter(card => !card.is_archived).length,
    [prevList?.cards]
  );
  const nextVisibleCount = useMemo(
    () => (nextList?.cards || []).filter(card => !card.is_archived).length,
    [nextList?.cards]
  );

  const listColor = list.color?.trim() || '';
  const normalizedListColor = listColor.toLowerCase();
  const headerMeta = listColor ? getHeaderColorMeta(listColor) : null;
  const hasListColor = !!headerMeta;
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
    if (!isAdding || !newCardInputRef.current || isTouch) return;
    const input = newCardInputRef.current;
    setTimeout(() => {
      input.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 50);
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

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== list.title) {
      onUpdateList(list.id, { title: titleValue });
    } else {
      setTitleValue(list.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave();
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitleValue(list.title);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle);
      setNewCardTitle('');
      setIsAdding(false);
    }
  };

  const handleMenuAction = (action: 'add' | 'copy' | 'archive' | 'archiveAllCards' | 'move' | 'moveAll' | 'remove') => {
      onCloseListMenu();
      if (action === 'add') {
        if (!canAddCards) return;
        setIsAdding(true);
        setTimeout(() => newCardInputRef.current?.focus(), 0);
        return;
      }
      if (action === 'copy' && onCopyList) onCopyList(list.id);
      if (action === 'archive') onUpdateList(list.id, { is_archived: true });
      if (action === 'archiveAllCards' && onArchiveAllCards) onArchiveAllCards(list.id);
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
        const targets = listOptions.filter(option => option.id !== list.id);
        if (targets.length === 0 || visibleCards.length === 0) return;
        const optionsText = targets.map(option => `${option.id}: ${option.title}`).join('\n');
        const selectedRaw = window.prompt(`${t('list.menu.moveAllPrompt')}\n${optionsText}`, String(targets[0].id));
        if (!selectedRaw) return;
        const destListId = Number(selectedRaw);
        if (Number.isNaN(destListId) || !targets.some(option => option.id === destListId)) return;
        visibleCards.forEach((cardItem, cardIndex) => {
          onMoveCard(cardItem.id, list.id, destListId, cardIndex);
        });
        return;
      }
      if (action === 'remove') onDeleteList(list.id);
  };

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

  const fallbackLeft = typeof window !== 'undefined' ? Math.max(8, window.innerWidth - 266) : 8;
  const resolvedMenuCoords = menuCoords ?? { top: 72, left: fallbackLeft };
  const listMenuDropdownStyle: React.CSSProperties | undefined = !isTouchViewport
    ? {
        position: 'fixed',
        top: resolvedMenuCoords.top,
        left: resolvedMenuCoords.left,
        right: 'auto',
        minWidth: 250,
        zIndex: 'var(--z-board-list-menu)'
      }
    : undefined;

  const listMenuContent = (
    <>
      <div
        ref={listMenuDropdownRef}
        className={`list-menu-dropdown ${isTouchViewport ? 'is-touch-portal' : ''}`.trim()}
        role="menu"
        aria-label={t('list.menu')}
        style={listMenuDropdownStyle}
      >
        <div className="list-menu-header">
          <span>{t('list.menu')}</span>
          <button
            type="button"
            className="list-menu-close"
            onClick={onCloseListMenu}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>
        <div className="list-menu-section">
          {canAddCards && (
            <button className="list-menu-item" role="menuitem" onClick={() => handleMenuAction('add')}>
              {t('list.menu.addCard')}
            </button>
          )}
          <button className="list-menu-item" role="menuitem" onClick={() => handleMenuAction('copy')}>
            {t('list.copy')}
          </button>
          <button className="list-menu-item" role="menuitem" onClick={() => handleMenuAction('move')}>
            {t('list.menu.move')}
          </button>
          <button className="list-menu-item" role="menuitem" onClick={() => handleMenuAction('moveAll')}>
            {t('list.menu.moveAll')}
          </button>
        </div>
        <div className="list-color-section">
          <button
            type="button"
            className="list-color-header"
            onClick={() => setIsColorPickerOpen((prev) => !prev)}
          >
            <span className="list-color-title">{t('list.color.title')}</span>
            <span className="list-color-chevron">{isColorPickerOpen ? '▾' : '▸'}</span>
          </button>
          {isColorPickerOpen && (
            <>
              <div className="list-color-grid">
                {LIST_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`list-color-swatch ${normalizedListColor === color.toLowerCase() ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => onUpdateList(list.id, { color })}
                    aria-pressed={normalizedListColor === color.toLowerCase()}
                    aria-label={color}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                className={`list-color-none ${!listColor ? 'active' : ''}`}
                onClick={() => onUpdateList(list.id, { color: '' })}
              >
                {t('list.color.none')}
              </button>
            </>
          )}
        </div>
        <div className="list-menu-divider" />
        <div className="list-menu-section">
          <button className="list-menu-item" role="menuitem" onClick={() => handleMenuAction('archive')}>
            {t('list.archive')}
          </button>
          <button className="list-menu-item" role="menuitem" onClick={() => handleMenuAction('archiveAllCards')}>
            {t('list.menu.archiveAllCards')}
          </button>
          <button className="list-menu-item danger" role="menuitem" onClick={() => handleMenuAction('remove')}>
            {t('common.delete')}
          </button>
        </div>
      </div>
    </>
  );

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

  if (isCollapsed) {
      return (
    <Draggable draggableId={`list-${list.id}`} index={index} isDragDisabled={!canEditList}>
            {(provided) => (
                <div 
                    className="kanban-column collapsed"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ 
                        ...provided.draggableProps.style, 
                        width: '40px', minWidth: '40px', 
                        alignItems: 'center', cursor: 'pointer',
                        writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                        padding: '12px 0',
                        background: hasListColor ? listColor : 'var(--bg-surface)',
                        borderRadius: '12px',
                        border: hasListColor ? `1px solid ${headerMeta.divider}` : '1px solid rgba(255,255,255,0.1)',
                        color: headerMeta?.text
                    }}
                    onClick={handleToggleCollapse}
                >
                    <span style={{ fontWeight: 600, color: headerMeta?.text || 'var(--text-primary)' }}>{list.title}</span>
                    <span className="count-badge" style={{ marginTop: 8, transform: 'rotate(90deg)', ...headerBadgeStyle }}>{visibleCount}</span>
                </div>
            )}
        </Draggable>
      );
  }

  return (
    <Draggable draggableId={`list-${list.id}`} index={index} isDragDisabled={!canEditList}>
      {(provided) => (
        <div
          className={`kanban-column ${hasListColor ? 'has-color' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className={`list-header ${hasListColor ? 'has-color' : ''}`} {...provided.dragHandleProps} style={headerStyle}>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                className="form-input"
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                style={{ height: '30px', padding: '4px 8px', fontSize: '14px', width: '100%' }}
              />
            ) : (
              <>
                <span 
                  onClick={() => { if (canEditList) setIsEditingTitle(true); }}
                  style={{ cursor: 'text', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8, flex: 1, color: headerMeta?.text }}
                  title={list.title}
                >
                  {list.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                    <span className="count-badge" style={headerBadgeStyle}>{visibleCount}</span>
                    {isTouch && canEditList && (
                      <>
                        <button
                          className="btn-icon"
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); handleMoveListLeft(); }}
                          disabled={!prevList}
                          title={t('list.moveLeft')}
                          aria-label={t('list.moveLeft')}
                          style={{ fontSize: 12, width: 22, height: 22, opacity: prevList ? 0.8 : 0.3, ...headerIconStyle }}
                        >
                          ◀
                        </button>
                        <button
                          className="btn-icon"
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); handleMoveListRight(); }}
                          disabled={!nextList}
                          title={t('list.moveRight')}
                          aria-label={t('list.moveRight')}
                          style={{ fontSize: 12, width: 22, height: 22, opacity: nextList ? 0.8 : 0.3, ...headerIconStyle }}
                        >
                          ▶
                        </button>
                      </>
                    )}
                    
                    {canEditList && (
                      <>
                        <button 
                          ref={listMenuTriggerRef}
                          className="list-menu-trigger btn-icon"
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!listMenuOpen && !isTouchViewport) {
                              setMenuCoords(getMenuCoords(listMenuTriggerRef.current));
                            }
                            onToggleListMenu(list.id);
                          }}
                          aria-haspopup="menu"
                          aria-expanded={listMenuOpen}
                          aria-label={t('list.menu')}
                          style={{ fontSize: 16, width: 24, height: 24, ...headerIconStyle }}
                        >
                          •••
                        </button>

                        {listMenuOpen && (typeof document !== 'undefined' ? createPortal(listMenuContent, document.body) : listMenuContent)}
                      </>
                    )}
                </div>
              </>
            )}
          </div>

          <div className="list-body">
            <Droppable droppableId={`list-${list.id}`} type="card">
              {(provided, snapshot) => (
                <div
                  className={`task-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {visibleCards.map((card, idx) => (
                    <CardItem 
                      key={card.id} 
                      card={card} 
                      index={idx} 
                      onClick={handleCardClick}
                      onToggleComplete={handleToggleComplete}
                      isTouch={isTouch}
                      canEdit={canEditCard ? canEditCard(card) : canEditList}
                      canMoveLeft={!!prevList}
                      canMoveRight={!!nextList}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < visibleCount - 1}
                      onMoveLeft={handleMoveCardLeft}
                      onMoveRight={handleMoveCardRight}
                      onMoveUp={handleMoveCardUp}
                      onMoveDown={handleMoveCardDown}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {canAddCards && (
              <div className="add-card-wrapper">
              {isAdding ? (
                  <form onSubmit={handleSubmit}>
                  <input type="text" name="fake-user" autoComplete="username" style={{ display: 'none' }} />
                  <input type="password" name="fake-pass" autoComplete="new-password" style={{ display: 'none' }} />
                  <input
                      ref={newCardInputRef}
                      className="form-input"
                      autoFocus
                      placeholder={t('card.create.placeholder')}
                      value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      inputMode="text"
                      enterKeyHint="done"
                      style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                      <Button type="submit" size="sm" className="btn-primary">{t('common.add')}</Button>
                      <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6 }} 
                          onClick={() => setIsAdding(false)}
                      >
                          {t('common.cancel')}
                      </button>
                  </div>
                  </form>
              ) : (
                  <button
                      className="btn-ghost"
                      onClick={() => setIsAdding(true)}
                  >
                      {t('card.create.newButton')}
                  </button>
              )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export const BoardColumn = React.memo(BoardColumnComponent);
