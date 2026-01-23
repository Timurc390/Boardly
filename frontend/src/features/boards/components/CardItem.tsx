import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card } from '../../../types';

interface CardItemProps {
  card: Card;
  index: number;
}

export const CardItem: React.FC<CardItemProps> = ({ card, index }) => {
  // ВАЖЛИВО: draggableId для картки має префікс 'card-'
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
        >
          <div className="task-title">{card.title}</div>
        </div>
      )}
    </Draggable>
  );
};