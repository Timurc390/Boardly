import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card } from '../../../types';

interface CardItemProps {
  card: Card;
  index: number;
  onClick: () => void;
  onToggleComplete: (cardId: number, next: boolean) => void;
}

export const CardItem: React.FC<CardItemProps> = ({ card, index, onClick, onToggleComplete }) => {
  const [isHover, setIsHover] = useState(false);
  return (
    <Draggable draggableId={`card-${card.id}`} index={index}>
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
            {(isHover || card.is_completed) && (
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
          </div>
          {card.labels && card.labels.length > 0 && (
            <div className="card-badges" style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
              {card.labels.map(l => (
                <div key={l.id} style={{ height: 6, width: 32, borderRadius: 3, background: l.color }} title={l.name}></div>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
