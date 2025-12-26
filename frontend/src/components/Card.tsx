import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

type Label = { id: number; name: string; color: string };
type User = { id: number; username: string };
export type ChecklistItemType = { id: number; text?: string; title?: string; is_checked: boolean; order: number; checklist?: number };
export type ChecklistType = { id: number; title: string; order: number; items?: ChecklistItemType[] };
export type CommentType = { id: number; content: string; user?: User; created_at?: string };
export type AttachmentType = { id: number; file: string; created_at?: string };

export type CardType = {
  id: number;
  title: string;
  description?: string;
  order: number;
  due_date?: string | null;
  labels?: Label[];
  members?: User[];
  checklists?: ChecklistType[];
  comments?: CommentType[];
  attachments?: AttachmentType[];
};

type Props = {
  card: CardType;
  index: number;
  onOpen: (card: CardType) => void;
};

export const Card: React.FC<Props> = ({ card, index, onOpen }) => {
  const totalItems = card.checklists?.reduce((acc, cl) => acc + (cl.items?.length || 0), 0) || 0;
  const doneItems = card.checklists?.reduce(
    (acc, cl) => acc + (cl.items?.filter(i => i.is_checked).length || 0),
    0
  ) || 0;
  const progress =
    totalItems > 0 ? `${doneItems}/${totalItems}` : null;

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen(card)}
          style={{
            background: '#fff',
            borderRadius: 4,
            padding: 8,
            marginBottom: 8,
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            {card.labels?.map(l => (
              <span key={l.id} style={{ background: l.color, padding: '4px 8px', borderRadius: 4, color: '#fff', fontSize: 12 }}>
                {l.name}
              </span>
            ))}
          </div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{card.title}</div>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#555' }}>
            {card.due_date && <span>⏰ {new Date(card.due_date).toLocaleDateString()}</span>}
            {progress && <span>☑ {progress}</span>}
            {card.members?.length ? <span>👥 {card.members.length}</span> : null}
          </div>
        </div>
      )}
    </Draggable>
  );
};
