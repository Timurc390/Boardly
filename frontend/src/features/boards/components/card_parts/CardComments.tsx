import React, { useState } from 'react';
import { Card, User } from '../../../../types';
import { Button } from '../../../../components/ui/Button';

interface CardCommentsProps {
  card: Card;
  user: User | null;
  onAddComment: (text: string) => void;
}

export const CardComments: React.FC<CardCommentsProps> = ({ card, user, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  return (
    <div className="card-section">
        <h4>Коментарі</h4>
        <div className="comment-input-area" style={{display: 'flex', gap: 12, marginBottom: 16}}>
            <div className="user-avatar" style={{width: 32, height: 32, borderRadius: '50%', background: '#555', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                {user?.username[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
                <textarea 
                    className="form-input" 
                    placeholder="Напишіть коментар..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    style={{marginBottom: 8, width: '100%', resize: 'none', height: '60px'}}
                />
                <Button size="sm" disabled={!newComment} onClick={() => {onAddComment(newComment); setNewComment('');}}>
                    Зберегти
                </Button>
            </div>
        </div>
        <div className="comments-list">
            {card.comments?.map(comment => (
                <div key={comment.id} className="comment-item" style={{marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <div className="comment-header" style={{fontSize: 13, color: '#888', marginBottom: 4}}>
                        <strong style={{color: 'var(--text-primary)', marginRight: 8}}>{comment.author?.username}</strong>
                        {new Date(comment.created_at).toLocaleString()}
                    </div>
                    <div className="comment-text">{comment.text}</div>
                </div>
            ))}
        </div>
    </div>
  );
};