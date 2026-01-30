import React, { useState, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { List, Card } from '../../../types';
import { CardItem } from './CardItem';
import { Button } from '../../../components/ui/Button';

interface BoardColumnProps {
  list: List;
  index: number;
  onAddCard: (listId: number, title: string) => void;
  onUpdateList: (listId: number, data: Partial<List>) => void;
  onDeleteList: (listId: number) => void;
  onCopyList?: (listId: number) => void;
  onCardClick: (card: Card) => void;
  onToggleCardComplete: (cardId: number, next: boolean) => void;
  
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ 
  list, 
  index, 
  onAddCard, 
  onUpdateList, 
  onDeleteList,
  onCopyList,
  onCardClick,
  onToggleCardComplete,
  isCollapsed,
  onToggleCollapse
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  const handleMenuAction = (action: 'copy' | 'archive' | 'collapse' | 'delete') => {
      setIsMenuOpen(false);
      if (action === 'copy' && onCopyList) onCopyList(list.id);
      if (action === 'archive') onUpdateList(list.id, { is_archived: true });
      if (action === 'delete') onDeleteList(list.id);
      if (action === 'collapse') onToggleCollapse();
  };

  if (isCollapsed) {
      return (
        <Draggable draggableId={`list-${list.id}`} index={index}>
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
                        background: 'var(--bg-surface)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    onClick={onToggleCollapse}
                >
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{list.title}</span>
                    <span className="count-badge" style={{ marginTop: 8, transform: 'rotate(90deg)' }}>{list.cards?.length || 0}</span>
                </div>
            )}
        </Draggable>
      );
  }

  return (
    <Draggable draggableId={`list-${list.id}`} index={index}>
      {(provided) => (
        <div
          className="kanban-column"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
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
              <>
                <span 
                  onClick={() => setIsEditingTitle(true)}
                  style={{ cursor: 'text', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8, flex: 1 }}
                  title={list.title}
                >
                  {list.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                    <span className="count-badge">{list.cards?.length || 0}</span>
                    
                    <button 
                      className="list-menu-trigger btn-icon"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      style={{ fontSize: 16, width: 24, height: 24 }}
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
                            <button className="menu-item" onClick={() => handleMenuAction('collapse')}>
                                🔽 Згорнути
                            </button>
                            <button className="menu-item" onClick={() => handleMenuAction('copy')}>
                                📋 Копіювати
                            </button>
                            <button className="menu-item" onClick={() => handleMenuAction('archive')}>
                                📦 Архівувати
                            </button>
                            <div style={{height:1, background:'rgba(255,255,255,0.1)', margin:'4px 0'}}></div>
                            <button className="menu-item" onClick={() => handleMenuAction('delete')} style={{color: 'var(--danger)'}}>
                                🗑️ Видалити
                            </button>
                        </div>
                        </>
                    )}
                </div>
              </>
            )}
          </div>

          <Droppable droppableId={`list-${list.id}`} type="card">
            {(provided, snapshot) => (
              <div
                className={`task-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {list.cards?.filter(c => !c.is_archived).map((card, idx) => (
                  <CardItem 
                    key={card.id} 
                    card={card} 
                    index={idx} 
                    onClick={() => onCardClick(card)}
                    onToggleComplete={onToggleCardComplete}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="add-card-wrapper">
            {isAdding ? (
                <form onSubmit={handleSubmit}>
                <input
                    className="form-input"
                    autoFocus
                    placeholder="Введіть заголовок..."
                    value={newCardTitle}
                    onChange={e => setNewCardTitle(e.target.value)}
                    style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                    <Button type="submit" size="sm" className="btn-primary">Додати</Button>
                    <button 
                        type="button" 
                        className="btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6 }} 
                        onClick={() => setIsAdding(false)}
                    >
                        Скасувати
                    </button>
                </div>
                </form>
            ) : (
                <button
                    className="btn-ghost"
                    onClick={() => setIsAdding(true)}
                >
                    + Додати картку
                </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
