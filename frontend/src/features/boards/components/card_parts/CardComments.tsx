import React, { useState } from 'react';
import { Card, User } from '../../../../types';
import { Button } from '../../../../components/ui/Button';
import { useI18n } from '../../../../context/I18nContext';

interface CardCommentsProps {
  card: Card;
  user: User | null;
  onAddComment: (text: string) => void;
  canEdit?: boolean;
}

export const CardComments: React.FC<CardCommentsProps> = ({ card, user, onAddComment, canEdit = true }) => {
  const { t, locale } = useI18n();
  const [newComment, setNewComment] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const avatarInitial = (user?.username?.[0] || user?.email?.[0] || '?').toUpperCase();

  return (
    <div className="card-section card-comments-panel">
        <div className="card-comments-header">
            <div className="card-comments-title">
              <span className="card-comments-icon" aria-hidden="true">💬</span>
              {t('comments.activityTitle')}
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm card-comments-toggle"
              onClick={() => setShowDetails(prev => !prev)}
            >
              {showDetails ? t('comments.hideDetails') : t('comments.showDetails')}
            </button>
        </div>
        {canEdit && (
          <div className="comment-input-area" style={{display: 'flex', gap: 12, marginBottom: 12}}>
              <div className="user-avatar" style={{width: 32, height: 32, borderRadius: '50%', background: '#555', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                  {avatarInitial}
              </div>
              <div style={{flex:1}}>
                  <textarea 
                      className="form-input" 
                      placeholder={t('comment.placeholder')}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      style={{marginBottom: 8, width: '100%', resize: 'none', height: '56px'}}
                  />
                  <Button size="sm" disabled={!newComment} onClick={() => {onAddComment(newComment); setNewComment('');}}>
                      {t('comments.add')}
                  </Button>
              </div>
          </div>
        )}
        {showDetails && (
          <div className="comments-list">
              {(!card.comments || card.comments.length === 0) && (
                <div className="empty-state">{t('comments.empty')}</div>
              )}
              {card.comments?.map(comment => (
                  <div key={comment.id} className="comment-item" style={{marginBottom: 12}}>
                      <div className="comment-header">
                          <strong style={{color: 'var(--text-primary)', marginRight: 8}}>{comment.author?.username}</strong>
                          {new Date(comment.created_at).toLocaleString(locale)}
                      </div>
                      <div className="comment-text">{comment.text}</div>
                  </div>
              ))}
          </div>
        )}
    </div>
  );
};
