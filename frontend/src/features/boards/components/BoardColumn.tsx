import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { List, Card } from '../../../types';
import { CardItem } from './CardItem';
import { Button } from '../../../components/ui/Button';
import { useI18n } from '../../../context/I18nContext';

const LIST_COLOR_OPTIONS = [
  { value: '#61bd4f', label: 'Green' },
  { value: '#f2d600', label: 'Yellow' },
  { value: '#ff9f1a', label: 'Orange' },
  { value: '#eb5a46', label: 'Red' },
  { value: '#c377e0', label: 'Purple' },
  { value: '#0079bf', label: 'Blue' },
  { value: '#00c2e0', label: 'Sky' },
  { value: '#51e898', label: 'Mint' },
  { value: '#ff78cb', label: 'Pink' },
  { value: '#344563', label: 'Slate' }
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
  canEdit?: boolean;
  onAddCard: (listId: number, title: string) => void;
  onUpdateList: (listId: number, data: Partial<List>) => void;
  onDeleteList: (listId: number) => void;
  onCopyList?: (listId: number) => void;
  onArchiveAllCards?: (listId: number) => void;
  onCardClick: (card: Card) => void;
  onToggleCardComplete: (cardId: number, next: boolean) => void;
  onMoveList?: (listId: number, fromIndex: number, toIndex: number) => void;
  onMoveCard?: (cardId: number, sourceListId: number, destListId: number, destIndex: number) => void;
  
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const BoardColumnComponent: React.FC<BoardColumnProps> = ({ 
  list, 
  index, 
  listIndex,
  listOptions,
  prevList,
  nextList,
  isTouch,
  canEdit = true,
  onAddCard, 
  onUpdateList, 
  onDeleteList,
  onCopyList,
  onArchiveAllCards,
  onCardClick,
  onToggleCardComplete,
  onMoveList,
  onMoveCard,
  isCollapsed,
  onToggleCollapse
}) => {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const newCardInputRef = useRef<HTMLInputElement>(null);

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

  const handleMenuAction = (action: 'add' | 'copy' | 'archive' | 'archiveAllCards' | 'move' | 'moveAll' | 'sort' | 'subscribe' | 'automation' | 'collapse' | 'delete') => {
      setIsMenuOpen(false);
      if (action === 'add') {
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
      if (action === 'sort' && onMoveCard) {
        if (visibleCards.length < 2) return;
        const modeRaw = window.prompt(
          `${t('list.menu.sortPrompt')}\n1 - ${t('list.menu.sortByDue')}\n2 - ${t('list.menu.sortByTitle')}`,
          '1'
        );
        if (!modeRaw) return;
        const mode = modeRaw.trim();
        const sortedCards = [...visibleCards];
        if (mode === '1') {
          sortedCards.sort((a, b) => {
            const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
            const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
            return aDue - bDue;
          });
        } else if (mode === '2') {
          sortedCards.sort((a, b) => a.title.localeCompare(b.title));
        } else {
          return;
        }
        sortedCards.forEach((cardItem, cardIndex) => {
          onMoveCard(cardItem.id, list.id, list.id, cardIndex);
        });
        return;
      }
      if (action === 'subscribe') {
        setIsSubscribed(prev => !prev);
        return;
      }
      if (action === 'automation') {
        window.alert(t('list.menu.comingSoon'));
        return;
      }
      if (action === 'delete') onDeleteList(list.id);
      if (action === 'collapse') onToggleCollapse();
  };

  const handleMoveListLeft = () => {
    if (!onMoveList || !prevList) return;
    onMoveList(list.id, listIndex, listIndex - 1);
  };

  const handleMoveListRight = () => {
    if (!onMoveList || !nextList) return;
    onMoveList(list.id, listIndex, listIndex + 1);
  };

  const handleColorSelect = useCallback((color: string | null) => {
    onUpdateList(list.id, { color });
  }, [list.id, onUpdateList]);

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

  if (isCollapsed) {
      return (
    <Draggable draggableId={`list-${list.id}`} index={index} isDragDisabled={!canEdit}>
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
                    onClick={onToggleCollapse}
                >
                    <span style={{ fontWeight: 600, color: headerMeta?.text || 'var(--text-primary)' }}>{list.title}</span>
                    <span className="count-badge" style={{ marginTop: 8, transform: 'rotate(90deg)', ...headerBadgeStyle }}>{visibleCount}</span>
                </div>
            )}
        </Draggable>
      );
  }

  return (
    <Draggable draggableId={`list-${list.id}`} index={index} isDragDisabled={!canEdit}>
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
                  onClick={() => { if (canEdit) setIsEditingTitle(true); }}
                  style={{ cursor: 'text', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8, flex: 1, color: headerMeta?.text }}
                  title={list.title}
                >
                  {list.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                    <span className="count-badge" style={headerBadgeStyle}>{visibleCount}</span>
                    {isTouch && canEdit && (
                      <>
                        <button
                          className="btn-icon"
                          onClick={(e) => { e.stopPropagation(); handleMoveListLeft(); }}
                          disabled={!prevList}
                          title={t('list.moveLeft')}
                          style={{ fontSize: 12, width: 22, height: 22, opacity: prevList ? 0.8 : 0.3, ...headerIconStyle }}
                        >
                          ◀
                        </button>
                        <button
                          className="btn-icon"
                          onClick={(e) => { e.stopPropagation(); handleMoveListRight(); }}
                          disabled={!nextList}
                          title={t('list.moveRight')}
                          style={{ fontSize: 12, width: 22, height: 22, opacity: nextList ? 0.8 : 0.3, ...headerIconStyle }}
                        >
                          ▶
                        </button>
                      </>
                    )}
                    
                    {canEdit && (
                      <>
                        <button 
                          className="list-menu-trigger btn-icon"
                          onClick={() => setIsMenuOpen(!isMenuOpen)}
                          style={{ fontSize: 16, width: 24, height: 24, ...headerIconStyle }}
                        >
                          •••
                        </button>

                        {isMenuOpen && (
                            <>
                            <div 
                                className="list-menu-overlay"
                                onClick={() => setIsMenuOpen(false)}
                            ></div>
                            <div className="list-menu-dropdown">
                                <div className="list-menu-section">
                                  <button className="list-menu-item" onClick={() => handleMenuAction('add')}>
                                      <span className="list-menu-icon">＋</span>
                                      {t('list.menu.addCard')}
                                  </button>
                                  <button className="list-menu-item" onClick={() => handleMenuAction('copy')}>
                                      <span className="list-menu-icon">📋</span>
                                      {t('list.copy')}
                                  </button>
                                  <button className="list-menu-item" onClick={() => handleMenuAction('move')}>
                                      <span className="list-menu-icon">⇄</span>
                                      {t('list.menu.move')}
                                  </button>
                                  <button className="list-menu-item" onClick={() => handleMenuAction('moveAll')}>
                                      <span className="list-menu-icon">↥</span>
                                      {t('list.menu.moveAll')}
                                  </button>
                                  <button className="list-menu-item" onClick={() => handleMenuAction('sort')}>
                                      <span className="list-menu-icon">⇅</span>
                                      {t('list.menu.sort')}
                                  </button>
                                  <button className="list-menu-item" onClick={() => handleMenuAction('subscribe')}>
                                      <span className="list-menu-icon">{isSubscribed ? '✅' : '👁️'}</span>
                                      {isSubscribed ? t('list.menu.unsubscribe') : t('list.menu.subscribe')}
                                  </button>
                                </div>
                                <div className="list-menu-divider" />
                                <div className={`list-color-section ${isColorOpen ? 'open' : ''}`}>
                                  <button
                                    type="button"
                                    className="list-color-header"
                                    onClick={() => setIsColorOpen(prev => !prev)}
                                  >
                                    <span>{t('list.color.title')}</span>
                                    <span className="list-color-chevron">{isColorOpen ? '▾' : '▸'}</span>
                                  </button>
                                  {isColorOpen && (
                                    <>
                                      <div className="list-color-grid">
                                        {LIST_COLOR_OPTIONS.map(option => (
                                          <button
                                            key={option.value}
                                            type="button"
                                            className={`list-color-swatch ${list.color === option.value ? 'active' : ''}`}
                                            style={{ background: option.value }}
                                            onClick={() => handleColorSelect(option.value)}
                                            title={option.label}
                                            aria-label={option.label}
                                          />
                                        ))}
                                      </div>
                                      <button
                                        type="button"
                                        className={`list-color-none ${listColor ? '' : 'active'}`}
                                        onClick={() => handleColorSelect(null)}
                                      >
                                        {t('list.color.none')}
                                      </button>
                                    </>
                                  )}
                                </div>
                                <div className="list-menu-divider" />
                                <div className="list-menu-section">
                                  <div className="list-menu-heading">{t('list.menu.automation')}</div>
                                  <button className="list-menu-item" onClick={() => handleMenuAction('automation')}>
                                      <span className="list-menu-icon">⚡</span>
                                      {t('list.menu.automationAdd')}
                                  </button>
                                  <button className="list-menu-item" onClick={() => handleMenuAction('automation')}>
                                      <span className="list-menu-icon">⏱️</span>
                                      {t('list.menu.automationDaily')}
                                  </button>
                                  <button className="list-menu-item" onClick={() => handleMenuAction('automation')}>
                                      <span className="list-menu-icon">➕</span>
                                      {t('list.menu.automationRule')}
                                  </button>
                                </div>
                                <div className="list-menu-divider" />
                                <button className="list-menu-item" onClick={() => handleMenuAction('archive')}>
                                    <span className="list-menu-icon">📦</span>
                                    {t('list.archive')}
                                </button>
                                <button className="list-menu-item" onClick={() => handleMenuAction('archiveAllCards')}>
                                    <span className="list-menu-icon">🗃️</span>
                                    {t('list.menu.archiveAllCards')}
                                </button>
                                <button className="list-menu-item" onClick={() => handleMenuAction('delete')} style={{color: 'var(--danger)'}}>
                                    <span className="list-menu-icon">🗑️</span>
                                    {t('common.delete')}
                                </button>
                                <button className="list-menu-item" onClick={() => handleMenuAction('collapse')}>
                                    <span className="list-menu-icon">▤</span>
                                    {t('list.collapse')}
                                </button>
                            </div>
                            </>
                        )}
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
                      canEdit={canEdit}
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

            {canEdit && (
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
