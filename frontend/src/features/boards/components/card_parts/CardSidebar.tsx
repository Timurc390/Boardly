import React from 'react';
import { Card, Board, User } from '../../../../types';
import { Button } from '../../../../components/ui/Button';

interface CardSidebarProps {
  card: Card;
  board: Board;
  user: User | null;
  canEdit: boolean;
  isCardMember: boolean | undefined;
  canManage: boolean;
  onJoinCard: () => void;
  onLeaveCard: () => void;
  onRemoveMember: (userId: number) => void;
  startEditingDueDate: () => void;
  onCopyCard: () => void;
  onUpdateCard: (data: Partial<Card>) => void;
  onDeleteCard: () => void;
  isEditingDueDate: boolean;
  dueDateInput: string;
  setDueDateInput: (val: string) => void;
  saveDueDate: () => void;
  removeDueDate: () => void;
  closeDueDateEdit: () => void;
}

export const CardSidebar: React.FC<CardSidebarProps> = ({ 
  card, board, user, canEdit, isCardMember, canManage,
  onJoinCard, onLeaveCard, onRemoveMember, startEditingDueDate,
  onCopyCard, onUpdateCard, onDeleteCard,
  isEditingDueDate, dueDateInput, setDueDateInput, saveDueDate, removeDueDate, closeDueDateEdit
}) => {
  return (
    <div className="card-sidebar">
        
        <h4 style={{fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8}}>Участь</h4>
        {isCardMember ? (
                <button type="button" className="sidebar-btn btn-danger" onClick={(e) => { e.preventDefault(); onLeaveCard(); }}>🏃‍♂️ Покинути</button>
        ) : (
                (card.is_public || canManage) ? (
                <button type="button" className="sidebar-btn" onClick={(e) => { e.preventDefault(); onJoinCard(); }}>🙋‍♂️ Приєднатися</button>
                ) : (
                <div style={{fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 8}}>Приватна картка</div>
                )
        )}

        {canManage && card.members && card.members.length > 0 && (
            <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Учасники картки
                </div>
                {card.members.map(member => (
                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                            {member.username || member.email}
                        </div>
                        <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={() => onRemoveMember(member.id)}
                        >
                            Видалити
                        </button>
                    </div>
                ))}
            </div>
        )}

        {canEdit && (
            <>
                <h4 style={{fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8, marginTop: 16}}>Додати</h4>
                {isEditingDueDate ? (
                    <div style={{background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 6, marginBottom: 8}}>
                        <input 
                            type="datetime-local" 
                            className="form-input" 
                            value={dueDateInput}
                            onChange={e => setDueDateInput(e.target.value)}
                            style={{marginBottom: 8, fontSize: 12}}
                        />
                        <div style={{display:'flex', gap: 4}}>
                            <Button size="sm" onClick={saveDueDate}>OK</Button>
                            <button type="button" className="btn-secondary btn-sm" onClick={closeDueDateEdit}>Х</button>
                        </div>
                        <button type="button" className="btn-link" style={{fontSize:12, marginTop:4, color: 'var(--danger)'}} onClick={removeDueDate}>
                            Видалити
                        </button>
                    </div>
                ) : (
                    <button type="button" className="sidebar-btn" onClick={startEditingDueDate}>🕒 Дедлайн</button>
                )}
            </>
        )}

        <h4 style={{marginTop: 20, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8}}>Дії</h4>
        
        <button type="button" className="sidebar-btn" onClick={(e) => { e.preventDefault(); onCopyCard(); }}>📋 Копіювати</button>
        
        {canEdit && (
            <>
                <button type="button" className="sidebar-btn" onClick={() => onUpdateCard({is_archived: !card.is_archived})}>
                    {card.is_archived ? '↩️ Відновити' : '📦 Архівувати'}
                </button>
                <button type="button" className="sidebar-btn btn-danger" style={{color: 'var(--danger)'}} onClick={() => {
                    if(window.confirm("Видалити картку?")) onDeleteCard();
                }}>🗑️ Видалити</button>
            </>
        )}
    </div>
  );
};
