import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card } from '../../../types';
import { useI18n } from '../../../context/I18nContext';

interface CardItemProps {
  card: Card;
  index: number;
  onClick: () => void;
  onToggleComplete: (cardId: number, next: boolean) => void;
  isTouch?: boolean;
  canEdit?: boolean;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const CardItem: React.FC<CardItemProps> = ({ 
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
          onClick={onClick}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(isHover || card.is_completed) && canEdit && (
              <input
                type="checkbox"
                checked={!!card.is_completed}
                onChange={(e) => onToggleComplete(card.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ width: 16, height: 16 }}
              />
            )}
            <div className="task-title" style={{ fontWeight: 500, lineHeight: 1.4 }}>
              {card.title}
            </div>
            {isTouch && canEdit && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
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
                  onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
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
                  onClick={(e) => { e.stopPropagation(); onMoveLeft?.(); }}
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
                  onClick={(e) => { e.stopPropagation(); onMoveRight?.(); }}
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
          {(card.labels && card.labels.length > 0) && (
            <div className="card-badges" style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
              {card.labels.map(l => (
                <div key={l.id} style={{ height: 6, width: 32, borderRadius: 3, background: l.color }} title={l.name}></div>
              ))}
            </div>
          )}
          {hasDueDate && (
            <div style={{ marginTop: card.labels && card.labels.length > 0 ? 6 : 4 }}>
              <span className={dueClass} title={dueTitle} aria-label={`${t('card.dueDate')}: ${dueTitle}`}>
                <span aria-hidden="true">🕒</span>
                <span>{dueText}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
