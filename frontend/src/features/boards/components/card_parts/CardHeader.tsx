import React from 'react';
import { Card, Board } from '../../../../types';

interface CardHeaderProps {
  card: Card;
  board: Board;
  canEdit: boolean;
  onUpdateCard: (data: Partial<Card>) => void;
  onCopyLink: () => void;
  onClose: () => void;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  card, board, canEdit, onUpdateCard, onCopyLink, onClose 
}) => {
  return (
    <div className="card-modal-header">
      <div style={{flex: 1}}>
        <input 
            className="card-title-input"
            value={card.title}
            onChange={e => onUpdateCard({ title: e.target.value })}
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? 'text' : 'not-allowed' }}
        />
        <div className="card-meta-row">
            У списку: <strong>{board.lists?.find(l => l.id === card.list)?.title}</strong>
        </div>
        
        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
            {card.members && card.members.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 4 }}>Виконавці:</span>
                    {card.members.map(member => (
                        <div key={member.id} className="member-avatar" style={{width: 24, height: 24, fontSize: 10}} title={member.username}>
                            {member.username[0].toUpperCase()}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-icon" onClick={onCopyLink} title="Скопіювати посилання">🔗</button>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>
    </div>
  );
};
