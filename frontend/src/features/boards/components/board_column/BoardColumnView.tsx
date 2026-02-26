import React from 'react';
import { createPortal } from 'react-dom';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { FiChevronLeft, FiChevronRight, FiMoreHorizontal } from 'shared/ui/fiIcons';
import { Button } from '../../../../components/ui/Button';
import { CardItem } from '../CardItem';
import { type Card, type List } from '../../../../types';

type BoardColumnViewProps = {
  list: List;
  index: number;
  isCollapsed: boolean;
  canEditList: boolean;
  canAddCards: boolean;
  isTouch?: boolean;
  prevList?: List | null;
  nextList?: List | null;
  visibleCards: Card[];
  visibleCount: number;
  hasListColor: boolean;
  listColor: string;
  headerMeta: { text: string; badgeBg: string; divider: string } | null;
  headerStyle?: React.CSSProperties;
  headerBadgeStyle?: React.CSSProperties;
  headerIconStyle?: React.CSSProperties;
  isEditingTitle: boolean;
  titleValue: string;
  setTitleValue: (value: string) => void;
  onTitleSave: () => void;
  onTitleKeyDown: (event: React.KeyboardEvent) => void;
  onStartTitleEdit: () => void;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  listMenuOpen: boolean;
  listMenuTriggerRef: React.RefObject<HTMLButtonElement | null>;
  onToggleMenu: () => void;
  listMenuContent: React.ReactNode;
  onToggleCollapse: () => void;
  isAdding: boolean;
  newCardTitle: string;
  setNewCardTitle: (value: string) => void;
  onSubmitCard: (event: React.FormEvent) => void;
  onStartAddCard: () => void;
  onCancelAddCard: () => void;
  newCardInputRef: React.RefObject<HTMLInputElement | null>;
  onCardClick: (card: Card) => void;
  onToggleCardComplete: (cardId: number, next: boolean) => void;
  canEditCard?: (card: Card) => boolean;
  onMoveCardLeft: (cardId: number) => void;
  onMoveCardRight: (cardId: number) => void;
  onMoveCardUp: (cardId: number, cardIndex: number) => void;
  onMoveCardDown: (cardId: number, cardIndex: number) => void;
  onMoveListLeft: () => void;
  onMoveListRight: () => void;
  t: (key: string) => string;
};

export const BoardColumnView: React.FC<BoardColumnViewProps> = ({
  list,
  index,
  isCollapsed,
  canEditList,
  canAddCards,
  isTouch,
  prevList,
  nextList,
  visibleCards,
  visibleCount,
  hasListColor,
  listColor,
  headerMeta,
  headerStyle,
  headerBadgeStyle,
  headerIconStyle,
  isEditingTitle,
  titleValue,
  setTitleValue,
  onTitleSave,
  onTitleKeyDown,
  onStartTitleEdit,
  titleInputRef,
  listMenuOpen,
  listMenuTriggerRef,
  onToggleMenu,
  listMenuContent,
  onToggleCollapse,
  isAdding,
  newCardTitle,
  setNewCardTitle,
  onSubmitCard,
  onStartAddCard,
  onCancelAddCard,
  newCardInputRef,
  onCardClick,
  onToggleCardComplete,
  canEditCard,
  onMoveCardLeft,
  onMoveCardRight,
  onMoveCardUp,
  onMoveCardDown,
  onMoveListLeft,
  onMoveListRight,
  t,
}) => {
  if (isCollapsed) {
    return (
      <Draggable draggableId={`list-${list.id}`} index={index} isDragDisabled={!canEditList}>
        {(provided, snapshot) => {
          const providedStyle = provided.draggableProps.style || {};
          const baseTransform = providedStyle.transform;
          const mergedTransform = snapshot.isDragging
            ? baseTransform
            : [baseTransform, 'rotate(180deg)'].filter(Boolean).join(' ');

          return (
            <div
              className={`kanban-column collapsed ${snapshot.isDragging ? 'dragging-list' : ''}`}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...providedStyle,
                width: '40px',
                minWidth: '40px',
                alignItems: 'center',
                cursor: 'pointer',
                writingMode: 'vertical-rl',
                transform: mergedTransform,
                padding: '12px 0',
                background: hasListColor ? listColor : 'var(--bg-surface)',
                borderRadius: '12px',
                border: hasListColor ? `1px solid ${headerMeta?.divider}` : '1px solid rgba(255,255,255,0.1)',
                color: headerMeta?.text,
              }}
              onClick={onToggleCollapse}
            >
              <span style={{ fontWeight: 600, color: headerMeta?.text || 'var(--text-primary)' }}>{list.title}</span>
              <span className="count-badge" style={{ marginTop: 8, transform: 'rotate(90deg)', ...headerBadgeStyle }}>{visibleCount}</span>
            </div>
          );
        }}
      </Draggable>
    );
  }

  return (
    <Draggable draggableId={`list-${list.id}`} index={index} isDragDisabled={!canEditList}>
      {(provided, snapshot) => (
        (() => {
          const baseStyle = provided.draggableProps.style || {};
          const fixedStyle =
            !snapshot.isDragging && (baseStyle as React.CSSProperties).pointerEvents === 'none'
              ? { ...baseStyle, pointerEvents: 'auto' as const }
              : baseStyle;
          return (
        <div
          className={`kanban-column ${hasListColor ? 'has-color' : ''} ${snapshot.isDragging ? 'dragging-list' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={fixedStyle}
        >
          <div className={`list-header ${hasListColor ? 'has-color' : ''}`} {...provided.dragHandleProps} style={headerStyle}>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                className="form-input"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={onTitleSave}
                onKeyDown={onTitleKeyDown}
                style={{ height: '30px', padding: '4px 8px', fontSize: '14px', width: '100%' }}
              />
            ) : (
              <>
                <span
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTitleEdit();
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onStartTitleEdit();
                  }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveListLeft();
                        }}
                        disabled={!prevList}
                        title={t('list.moveLeft')}
                        aria-label={t('list.moveLeft')}
                        style={{ fontSize: 12, width: 22, height: 22, opacity: prevList ? 0.8 : 0.3, ...headerIconStyle }}
                      >
                        <FiChevronLeft aria-hidden="true" />
                      </button>
                      <button
                        className="btn-icon"
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveListRight();
                        }}
                        disabled={!nextList}
                        title={t('list.moveRight')}
                        aria-label={t('list.moveRight')}
                        style={{ fontSize: 12, width: 22, height: 22, opacity: nextList ? 0.8 : 0.3, ...headerIconStyle }}
                      >
                        <FiChevronRight aria-hidden="true" />
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
                          onToggleMenu();
                        }}
                        aria-haspopup="menu"
                        aria-expanded={listMenuOpen}
                        aria-label={t('list.menu')}
                        style={{ fontSize: 16, width: 24, height: 24, ...headerIconStyle }}
                      >
                        <FiMoreHorizontal aria-hidden="true" />
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
              {(dropProvided, dropSnapshot) => (
                <div className={`task-list ${dropSnapshot.isDraggingOver ? 'drag-over' : ''}`} ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                  {visibleCards.map((card, idx) => (
                    <CardItem
                      key={card.id}
                      card={card}
                      index={idx}
                      onClick={onCardClick}
                      onToggleComplete={onToggleCardComplete}
                      isTouch={isTouch}
                      canEdit={canEditCard ? canEditCard(card) : canEditList}
                      canMoveLeft={!!prevList}
                      canMoveRight={!!nextList}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < visibleCount - 1}
                      onMoveLeft={onMoveCardLeft}
                      onMoveRight={onMoveCardRight}
                      onMoveUp={onMoveCardUp}
                      onMoveDown={onMoveCardDown}
                    />
                  ))}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>

            {canAddCards && (
              <div className="add-card-wrapper">
                {isAdding ? (
                  <form onSubmit={onSubmitCard}>
                    <input type="text" name="fake-user" autoComplete="username" style={{ display: 'none' }} />
                    <input type="password" name="fake-pass" autoComplete="new-password" style={{ display: 'none' }} />
                    <input
                      ref={newCardInputRef}
                      className="form-input"
                      autoFocus
                      placeholder={t('card.create.placeholder')}
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
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
                        onClick={onCancelAddCard}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button className="btn-ghost" onClick={onStartAddCard}>
                    {t('card.create.newButton')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
          );
        })()
      )}
    </Draggable>
  );
};
