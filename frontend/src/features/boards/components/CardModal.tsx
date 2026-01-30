import React, { useState } from 'react';
import { Card, Board } from '../../../types';
import { CardHeader } from './card_parts/CardHeader';
import { CardLabels } from './card_parts/CardLabels';
import { CardDescription } from './card_parts/CardDescription';
import { CardChecklists } from './card_parts/CardChecklists';
import { CardComments } from './card_parts/CardComments';
import { CardSidebar } from './card_parts/CardSidebar';

import { useAppSelector } from '../../../store/hooks';

interface CardModalProps {
  card: Card;
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onUpdateCard: (data: Partial<Card>) => void;
  onDeleteCard: () => void;
  onCopyCard: () => void;
  onAddChecklist: (title: string) => void;
  onAddChecklistItem: (checklistId: number, text: string) => Promise<any> | void;
  onDeleteChecklistItem: (itemId: number, checklistId?: number) => Promise<any> | void;
  onToggleChecklistItem: (itemId: number, isChecked: boolean) => Promise<any> | void;
  onUpdateChecklistItem: (itemId: number, text: string) => Promise<any> | void;
  onAddComment: (text: string) => void;
  onUpdateLabels: (labelIds: number[]) => void;
  onCreateLabel: (name: string, color: string) => void;
  onUpdateLabel: (id: number, name: string, color: string) => void;
  onDeleteLabel: (id: number) => void;
  onJoinCard: () => void;
  onLeaveCard: () => void;
  onRemoveMember: (userId: number) => void;
}

const formatDateForInput = (isoString?: string | null) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getOverdueText = (isoString?: string | null) => {
  if (!isoString) return null;
  const now = new Date();
  const due = new Date(isoString);
  if (now <= due) return null;

  const diffMs = now.getTime() - due.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `(Прострочено на ${diffDays} дн.)`;
  if (diffHours > 0) return `(Прострочено на ${diffHours} год.)`;
  return `(Прострочено на ${diffMins} хв.)`;
};


export const CardModal: React.FC<CardModalProps> = ({ 
  card, board, isOpen, onClose, 
  onCopyLink, onUpdateCard, onDeleteCard, onCopyCard,
  onAddChecklist, onAddChecklistItem, onDeleteChecklistItem, onToggleChecklistItem, onUpdateChecklistItem, onAddComment,
  onUpdateLabels, onCreateLabel, onUpdateLabel, onDeleteLabel,
  onJoinCard, onLeaveCard, onRemoveMember
}) => {
  const { user } = useAppSelector(state => state.auth);
  
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateInput, setDueDateInput] = useState('');

  const isOwner = board.owner?.id === user?.id;
  const isAdmin = board.members?.some(m => m.user.id === user?.id && m.role === 'admin');
  const isCardMember = card.members?.some(u => u.id === user?.id);
  
  const canEdit = !!(isOwner || isAdmin || isCardMember);
  const canManage = !!(isOwner || isAdmin);

  if (!isOpen || !user) return null;

  const startEditingDueDate = () => {
    setDueDateInput(formatDateForInput(card.due_date));
    setIsEditingDueDate(true);
  };

  const saveDueDate = () => {
    if (!dueDateInput) return;
    const date = new Date(dueDateInput);
    onUpdateCard({ due_date: date.toISOString(), is_completed: false });
    setIsEditingDueDate(false);
  };

  const removeDueDate = () => {
    onUpdateCard({ due_date: null, is_completed: false });
    setIsEditingDueDate(false);
  };

  const overdueText = !card.is_completed ? getOverdueText(card.due_date) : null;
  const isOverdue = !!overdueText;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '900px', width: '90%'}}>
        
        <CardHeader 
          card={card} 
          board={board} 
          canEdit={canEdit} 
          onUpdateCard={onUpdateCard} 
          onCopyLink={onCopyLink}
          onClose={onClose} 
        />

        <div className="card-modal-body">
            <div className="card-main-col">
                <CardLabels 
                    card={card} 
                    board={board} 
                    canEdit={canEdit}
                    onUpdateLabels={onUpdateLabels} 
                    onCreateLabel={onCreateLabel}
                    onUpdateLabel={onUpdateLabel}
                    onDeleteLabel={onDeleteLabel}
                    startEditingDueDate={startEditingDueDate}
                    isOverdue={isOverdue}
                    overdueText={overdueText}
                />

                <CardDescription 
                    card={card} 
                    canEdit={canEdit} 
                    onUpdateCard={onUpdateCard} 
                />

                <CardChecklists 
                    board={board}
                    card={card} 
                    canEdit={canEdit} 
                    onAddChecklistItem={onAddChecklistItem} 
                    onDeleteChecklistItem={onDeleteChecklistItem}
                    onToggleChecklistItem={onToggleChecklistItem} 
                    onUpdateChecklistItem={onUpdateChecklistItem}
                />

                <CardComments 
                    card={card} 
                    user={user} 
                    onAddComment={onAddComment} 
                />
            </div>

            <CardSidebar 
                card={card} 
                board={board} 
                user={user} 
                canEdit={canEdit} 
                isCardMember={isCardMember} 
                canManage={canManage}
                onJoinCard={onJoinCard} 
                onLeaveCard={onLeaveCard} 
                onRemoveMember={onRemoveMember}
                startEditingDueDate={startEditingDueDate}
                onCopyCard={onCopyCard}
                onUpdateCard={onUpdateCard}
                onDeleteCard={() => { onDeleteCard(); onClose(); }} 
                isEditingDueDate={isEditingDueDate}
                dueDateInput={dueDateInput}
                setDueDateInput={setDueDateInput}
                saveDueDate={saveDueDate}
                removeDueDate={removeDueDate}
                closeDueDateEdit={() => setIsEditingDueDate(false)}
            />
        </div>

      </div>
    </div>
  );
};
