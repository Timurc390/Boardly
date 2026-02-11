import React, { useState } from 'react';
import { Card, User, Comment } from '../../../../types';
import { Button } from '../../../../components/ui/Button';
import { useI18n } from '../../../../context/I18nContext';

interface CardCommentsProps {
  card: Card;
  user: User | null;
  onAddComment: (text: string) => void;
  onUpdateComment: (commentId: number, text: string) => void;
  onDeleteComment: (commentId: number) => void;
  canEditComment?: (comment: Comment) => boolean;
  canDeleteComment?: (comment: Comment) => boolean;
  canEdit?: boolean;
}

export const CardComments: React.FC<CardCommentsProps> = ({
  card,
  user,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  canEditComment,
  canDeleteComment,
  canEdit = true
}) => {
  const { t, locale } = useI18n();
  const [newComment, setNewComment] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const fallbackAvatar = '/board-avatars/ava-anto-treklo.png';
  const avatarInitial = (user?.username?.[0] || user?.email?.[0] || '?').toUpperCase();
  const getAvatarSrc = (member?: User | null) => {
    const candidate = member?.profile?.avatar_url || member?.profile?.avatar || '';
    if (!candidate) return fallbackAvatar;
    if (candidate.startsWith('data:') || candidate.startsWith('http') || candidate.startsWith('/')) return candidate;
    return `/${candidate}`;
  };
  const userAvatar = getAvatarSrc(user);

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
          <div className="comment-input-area comment-input-layout">
              <div className="user-avatar comment-input-avatar">
                <img
                  src={userAvatar}
                  alt={user?.username || user?.email || 'user'}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
                  }}
                />
                <span className="comment-avatar-fallback">{avatarInitial}</span>
              </div>
              <div className="comment-input-body">
                  <textarea 
                      className="form-input comment-textarea" 
                      placeholder={t('comment.placeholder')}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
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
              {card.comments?.map(comment => {
                const canEditCurrent = canEditComment ? canEditComment(comment) : false;
                const canDeleteCurrent = canDeleteComment ? canDeleteComment(comment) : false;
                const isEditing = editingId === comment.id;
                return (
                  <div key={comment.id} className="comment-item">
                      <div className="comment-avatar">
                        <img
                          src={getAvatarSrc(comment.author)}
                          alt={comment.author?.username || comment.author?.email || 'author'}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
                          }}
                        />
                        <span className="comment-avatar-fallback">
                          {(comment.author?.username?.[0] || comment.author?.email?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                      <div className="comment-content">
                        <div className="comment-header">
                            <strong className="comment-author">{comment.author?.username}</strong>
                            <span className="comment-date">{new Date(comment.created_at).toLocaleString(locale)}</span>
                        </div>
                        {isEditing ? (
                          <div className="comment-edit">
                            <textarea
                              className="form-input comment-textarea"
                              value={editingText}
                              onChange={e => setEditingText(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Button size="sm" onClick={() => { if (editingId) onUpdateComment(editingId, editingText); setEditingId(null); }}>
                                {t('common.save')}
                              </Button>
                              <button
                                type="button"
                                className="btn-secondary btn-sm"
                                onClick={() => { setEditingId(null); setEditingText(''); }}
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="comment-text">{comment.text}</div>
                        )}
                        {(canEditCurrent || canDeleteCurrent) && !isEditing && (
                          <div className="comment-actions">
                            {canEditCurrent && (
                              <button
                                type="button"
                                className="comment-action"
                                onClick={() => { setEditingId(comment.id); setEditingText(comment.text); }}
                              >
                                {t('common.edit')}
                              </button>
                            )}
                            {canEditCurrent && canDeleteCurrent && <span>•</span>}
                            {canDeleteCurrent && (
                              <button
                                type="button"
                                className="comment-action"
                                onClick={() => onDeleteComment(comment.id)}
                              >
                                {t('common.delete')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                  </div>
                );
              })}
          </div>
        )}
    </div>
  );
};
