import React, { useCallback, useMemo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card } from '../../../types';
import { useI18n } from '../../../context/I18nContext';

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

const getContrastText = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#f8fafc';
  const [r, g, b] = rgb;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#f8fafc';
};

interface CardItemProps {
  card: Card;
  index: number;
  onClick: (card: Card) => void;
  onToggleComplete: (cardId: number, next: boolean) => void;
  isTouch?: boolean;
  canEdit?: boolean;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveLeft?: (cardId: number) => void;
  onMoveRight?: (cardId: number) => void;
  onMoveUp?: (cardId: number, index: number) => void;
  onMoveDown?: (cardId: number, index: number) => void;
}

const CardItemComponent: React.FC<CardItemProps> = ({ 
  card, 
  index, 
  onClick, 
  onToggleComplete,
  isTouch,
  canEdit = true,
  canMoveLeft,
  canMoveRight,
  canMoveUp,
  canMoveDown,
  onMoveLeft,
  onMoveRight,
  onMoveUp,
  onMoveDown
}) => {
  const { t, locale } = useI18n();
  const [isHover, setIsHover] = useState(false);
  const handleClick = useCallback(() => onClick(card), [card, onClick]);
  const dueDate = card.due_date ? new Date(card.due_date) : null;
  const hasDueDate = !!(dueDate && !Number.isNaN(dueDate.getTime()));
  const isOverdue = !!(hasDueDate && dueDate && !card.is_completed && dueDate < new Date());
  const dueText = hasDueDate && dueDate
    ? dueDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    : '';
  const dueTitle = hasDueDate && dueDate
    ? dueDate.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
  const dueClass = [
    'card-due-badge',
    'card-due-chip',
    card.is_completed ? 'completed' : isOverdue ? 'overdue' : ''
  ].filter(Boolean).join(' ');
  const coverColor = card.card_color?.trim() || '';
  const coverMode = card.cover_size === 'full' ? 'full' : 'header';
  const labels = card.labels || [];
  const hasLabels = labels.length > 0;
  const hasDescription = !!card.description?.trim();
  const commentCount = card.comments?.length || 0;
  const attachmentCount = card.attachments?.length || 0;
  const checklistStats = useMemo(() => {
    const lists = card.checklists || [];
    const total = lists.reduce((sum, checklist) => sum + (checklist.items?.length || 0), 0);
    const done = lists.reduce(
      (sum, checklist) => sum + (checklist.items || []).filter(item => item.is_checked).length,
      0
    );
    return { total, done };
  }, [card.checklists]);
  const hasChecklist = checklistStats.total > 0;
  const isChecklistComplete = hasChecklist && checklistStats.done === checklistStats.total;
  const hasMeta = hasDescription || commentCount > 0 || attachmentCount > 0 || hasChecklist || hasDueDate;
  return (
    <Draggable draggableId={`card-${card.id}`} index={index} isDragDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
          }}
          onClick={handleClick}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          {coverColor && (
            <div className={`card-item-cover ${coverMode}`} style={{ background: coverColor }} />
          )}
          <div className="card-body">
            {hasLabels && (
              <div className="card-labels">
                {labels.map(label => (
                  <span
                    key={label.id}
                    className="card-label-pill"
                    style={{ background: label.color, color: getContrastText(label.color) }}
                    title={label.name}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}
            <div className="card-title-row">
              {card.is_completed && (
                <button
                  type="button"
                  className="card-complete-indicator"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canEdit) onToggleComplete(card.id, false);
                  }}
                  title={t('card.uncomplete')}
                  aria-label={t('card.uncomplete')}
                >
                  ✓
                </button>
              )}
              {!card.is_completed && isHover && canEdit && (
                <input
                  type="checkbox"
                  checked={!!card.is_completed}
                  onChange={(e) => onToggleComplete(card.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ width: 16, height: 16 }}
                />
              )}
              <div className={`task-title ${card.is_completed ? 'is-completed' : ''}`}>
                {card.title}
              </div>
              {isTouch && canEdit && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); onMoveUp?.(card.id, index); }}
                    disabled={!canMoveUp}
                    title={t('card.moveUp')}
                    aria-label={t('card.moveUp')}
                    style={{ width: 20, height: 20, fontSize: 12, opacity: canMoveUp ? 0.8 : 0.3 }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); onMoveDown?.(card.id, index); }}
                    disabled={!canMoveDown}
                    title={t('card.moveDown')}
                    aria-label={t('card.moveDown')}
                    style={{ width: 20, height: 20, fontSize: 12, opacity: canMoveDown ? 0.8 : 0.3 }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); onMoveLeft?.(card.id); }}
                    disabled={!canMoveLeft}
                    title={t('card.moveLeft')}
                    aria-label={t('card.moveLeft')}
                    style={{ width: 20, height: 20, fontSize: 12, opacity: canMoveLeft ? 0.8 : 0.3 }}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); onMoveRight?.(card.id); }}
                    disabled={!canMoveRight}
                    title={t('card.moveRight')}
                    aria-label={t('card.moveRight')}
                    style={{ width: 20, height: 20, fontSize: 12, opacity: canMoveRight ? 0.8 : 0.3 }}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
            {hasMeta && (
              <div className="card-meta-row">
                {hasDescription && (
                  <span className="card-meta-item" title={t('card.descriptionTitle')}>
                    <span className="card-meta-icon" aria-hidden="true">≡</span>
                  </span>
                )}
                {commentCount > 0 && (
                  <span className="card-meta-item" title={t('comments.title')}>
                    <span className="card-meta-icon" aria-hidden="true">💬</span>
                    {commentCount}
                  </span>
                )}
                {attachmentCount > 0 && (
                  <span className="card-meta-item" title={t('attachments.title')}>
                    <span className="card-meta-icon" aria-hidden="true">📎</span>
                    {attachmentCount}
                  </span>
                )}
                {hasChecklist && (
                  <span className={`card-meta-item ${isChecklistComplete ? 'done' : ''}`} title={t('checklist.title')}>
                    <span className="card-meta-icon" aria-hidden="true">☑</span>
                    {checklistStats.done}/{checklistStats.total}
                  </span>
                )}
                {hasDueDate && (
                  <span className={dueClass} title={dueTitle} aria-label={`${t('card.dueDate')}: ${dueTitle}`}>
                    <span aria-hidden="true">🕒</span>
                    <span>{dueText}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export const CardItem = React.memo(CardItemComponent);
