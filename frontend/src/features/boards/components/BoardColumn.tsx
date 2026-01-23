import React, { useState, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { List } from '../../../types';
import { CardItem } from './CardItem';
import { Button } from '../../../components/ui/Button';

interface BoardColumnProps {
  list: List;
  index: number;
  onAddCard: (listId: number, title: string) => void;
  onUpdateList: (listId: number, data: Partial<List>) => void; // Новий проп
  onDeleteList: (listId: number) => void; // Новий проп
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ 
  list, 
  index, 
  onAddCard, 
  onUpdateList, 
  onDeleteList 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  
  // Стейт для редагування заголовка
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Автофокус при переході в режим редагування
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== list.title) {
      onUpdateList(list.id, { title: titleValue });
    } else {
      setTitleValue(list.title); // Повернути стару назву, якщо пусто або без змін
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

  return (
    <Draggable draggableId={`list-${list.id}`} index={index}>
      {(provided) => (
        <div
          className="kanban-column"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          {/* Header зі зміною назви та видаленням */}
          <div className="list-header" {...provided.dragHandleProps}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span 
                  className="list-title" 
                  onClick={() => setIsEditingTitle(true)}
                  title="Клікніть, щоб перейменувати"
                  style={{ cursor: 'pointer', flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {list.title}
                  <span className="count-badge" style={{ marginLeft: 8 }}>{list.cards?.length || 0}</span>
                </span>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                  className="btn-link" 
                  style={{ 
                    minWidth: 24, width: 24, height: 24, padding: 0, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: '#666', fontSize: '16px', marginLeft: 8
                  }}
                  title="Видалити список"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <Droppable droppableId={`list-${list.id}`} type="card">
            {(provided, snapshot) => (
              <div
                className={`task-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {list.cards?.map((card, idx) => (
                  <CardItem key={card.id} card={card} index={idx} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {isAdding ? (
            <form onSubmit={handleSubmit} style={{ marginTop: 8, padding: '0 4px' }}>
              <input
                className="form-input"
                autoFocus
                placeholder="Заголовок картки..."
                value={newCardTitle}
                onChange={e => setNewCardTitle(e.target.value)}
                style={{ marginBottom: 8, fontSize: '13px', padding: '8px' }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <Button type="submit" size="sm" className="btn-primary">Додати</Button>
                <Button type="button" size="sm" className="btn-secondary" onClick={() => setIsAdding(false)}>✕</Button>
              </div>
            </form>
          ) : (
            <button
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', color: '#888', marginTop: 8 }}
              onClick={() => setIsAdding(true)}
            >
              + Додати картку
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
};