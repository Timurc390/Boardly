import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, User, Comment } from '../../../../types';
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
  onClose?: () => void;
}

export const CardComments: React.FC<CardCommentsProps> = ({
  card,
  user,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  canEditComment,
  canDeleteComment,
  canEdit = true,
  onClose
}) => {
  const { t, locale } = useI18n();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [openReactionCommentId, setOpenReactionCommentId] = useState<number | null>(null);
  const [reactionsByComment, setReactionsByComment] = useState<
    Record<number, { counts: Record<string, number>; mine: string[] }>
  >({});
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [pendingOwnScroll, setPendingOwnScroll] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fallbackAvatar = '/board-avatars/ava-anto-treklo.png';
  const emojiOptions = ['😀', '😂', '😍', '🤔', '🔥', '👏', '👍', '❤️', '🎉', '✅'];
  const reactionOptions = ['👍', '❤️', '🔥', '🎉', '😂', '😮', '👏', '✅'];
  const commentsCount = card.comments?.length || 0;

  const getAvatarSrc = (member?: User | null) => {
    const candidate = member?.profile?.avatar_url || member?.profile?.avatar || '';
    if (!candidate) return fallbackAvatar;
    if (candidate.startsWith('data:') || candidate.startsWith('http') || candidate.startsWith('/')) return candidate;
    return `/${candidate}`;
  };

  const submitNewComment = () => {
    const next = newComment.trim();
    if (!next) return;
    setPendingOwnScroll(true);
    onAddComment(next);
    setNewComment('');
    setIsEmojiOpen(false);
  };

  const appendEmoji = (emoji: string) => {
    setNewComment(prev => `${prev}${emoji}`);
    inputRef.current?.focus();
  };

  const replyToAuthor = (authorName: string) => {
    const mention = `@${authorName.replace(/\s+/g, '_')} `;
    setNewComment(prev => (prev.trim() ? `${prev.trim()} ${mention}` : mention));
    inputRef.current?.focus();
    setIsEmojiOpen(false);
    setOpenReactionCommentId(null);
  };

  const toggleReaction = (commentId: number, emoji: string) => {
    setReactionsByComment(prev => {
      const current = prev[commentId] || { counts: {}, mine: [] };
      const mineSet = new Set(current.mine);
      const counts = { ...current.counts };

      if (mineSet.has(emoji)) {
        mineSet.delete(emoji);
        const nextCount = (counts[emoji] || 1) - 1;
        if (nextCount <= 0) delete counts[emoji];
        else counts[emoji] = nextCount;
      } else {
        mineSet.add(emoji);
        counts[emoji] = (counts[emoji] || 0) + 1;
      }

      return {
        ...prev,
        [commentId]: {
          counts,
          mine: Array.from(mineSet)
        }
      };
    });
    setOpenReactionCommentId(null);
  };

  useEffect(() => {
    if (!listRef.current) return;
    if (!isNearBottom && !pendingOwnScroll) return;
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: pendingOwnScroll ? 'smooth' : 'auto'
    });
    if (pendingOwnScroll) setPendingOwnScroll(false);
  }, [commentsCount, isNearBottom, pendingOwnScroll]);

  const sortedComments = useMemo(() => {
    const items = [...(card.comments || [])];
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return items;
  }, [card.comments]);

  const handleListScroll = () => {
    if (!listRef.current) return;
    const el = listRef.current;
    const delta = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(delta < 72);
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !rootRef.current) return;
      if (!rootRef.current.contains(target)) return;

      const keepReactionOpen = !!target.closest(
        '.card-comment-reaction-picker, .card-comment-reaction-add, .card-comment-tool'
      );
      if (!keepReactionOpen) {
        setOpenReactionCommentId(null);
      }

      const keepEmojiOpen = !!target.closest(
        '.card-comments-emoji-picker, .card-comments-emoji-trigger'
      );
      if (!keepEmojiOpen) {
        setIsEmojiOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  return (
    <div className="card-section card-comments-panel" ref={rootRef}>
      <div className="card-comments-header">
        <div className="card-comments-title">
          <span className="card-comments-icon" aria-hidden="true">💬</span>
          {t('comments.title')}
        </div>
        {onClose && (
          <button
            type="button"
            className="btn-icon card-comments-close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        )}
      </div>

      <div className="comments-list card-comments-list" ref={listRef} onScroll={handleListScroll}>
        {(!card.comments || card.comments.length === 0) && (
          <div className="empty-state">{t('comments.empty')}</div>
        )}
        {sortedComments.map(comment => {
          const canEditCurrent = canEditComment ? canEditComment(comment) : false;
          const canDeleteCurrent = canDeleteComment ? canDeleteComment(comment) : false;
          const isEditing = editingId === comment.id;
          const authorName = comment.author?.username || comment.author?.email || t('common.unknown');
          const reactionState = reactionsByComment[comment.id] || { counts: {}, mine: [] };
          const reactionEntries = Object.entries(reactionState.counts);

          return (
            <div key={comment.id} className="comment-item card-comment-item">
              <div className="comment-avatar card-comment-avatar">
                <img
                  src={getAvatarSrc(comment.author)}
                  alt={authorName}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
                  }}
                />
              </div>
              <div className="comment-content card-comment-content">
                <div className="comment-header">
                  <strong className="comment-author">{authorName}</strong>
                  <span className="comment-date">{new Date(comment.created_at).toLocaleString(locale)}</span>
                </div>

                {isEditing ? (
                  <div className="comment-edit">
                    <textarea
                      className="form-input comment-textarea"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                    />
                    <div className="card-comment-edit-actions">
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => {
                          if (editingId) onUpdateComment(editingId, editingText);
                          setEditingId(null);
                        }}
                      >
                        {t('common.save')}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditingText('');
                        }}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="comment-text card-comment-bubble">
                      <span>{comment.text}</span>
                      <div className="card-comment-tools">
                        <button
                          type="button"
                          className="card-comment-tool"
                          aria-label={t('comments.addReaction')}
                          onClick={() => {
                            setOpenReactionCommentId(prev => (prev === comment.id ? null : comment.id));
                          }}
                        >
                          😊
                        </button>
                        <button
                          type="button"
                          className="card-comment-reply"
                          onClick={() => replyToAuthor(authorName)}
                        >
                          {t('comments.answer')}
                        </button>
                      </div>
                    </div>
                    <div className="card-comment-reactions-row">
                      {reactionEntries.map(([emoji, count]) => {
                        const isMine = reactionState.mine.includes(emoji);
                        return (
                          <button
                            key={`${comment.id}-${emoji}`}
                            type="button"
                            className={`card-comment-reaction-chip ${isMine ? 'active' : ''}`}
                            onClick={() => toggleReaction(comment.id, emoji)}
                            aria-label={`${emoji} ${count}`}
                            title={`${emoji} ${count}`}
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className="card-comment-reaction-add"
                        aria-label={t('comments.react')}
                        onClick={() => {
                          setOpenReactionCommentId(prev => (prev === comment.id ? null : comment.id));
                        }}
                      >
                        +
                      </button>
                    </div>
                    {openReactionCommentId === comment.id && (
                      <div className="card-comment-reaction-picker" role="listbox" aria-label={t('comments.reactionPicker')}>
                        {reactionOptions.map(emoji => (
                          <button
                            key={`${comment.id}-picker-${emoji}`}
                            type="button"
                            className="card-comment-reaction-option"
                            onClick={() => toggleReaction(comment.id, emoji)}
                            aria-label={emoji}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {(canEditCurrent || canDeleteCurrent) && !isEditing && (
                  <div className="comment-actions">
                    {canEditCurrent && (
                      <button
                        type="button"
                        className="comment-action"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditingText(comment.text);
                        }}
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

      {canEdit && (
        <div className="card-comments-compose card-comments-compose-sticky">
          <div className="card-comments-compose-row">
            <input
              ref={inputRef}
              className="form-input card-comments-input"
              placeholder={t('comment.placeholder')}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitNewComment();
                }
              }}
            />
            <button
              type="button"
              className="card-comments-emoji-trigger"
              onClick={() => setIsEmojiOpen(prev => !prev)}
              aria-label={t('comments.reactionPicker')}
            >
              😊
            </button>
            <button
              type="button"
              className="card-comments-send"
              onClick={submitNewComment}
              aria-label={t('comments.send')}
              disabled={!newComment.trim()}
            >
              ➤
            </button>
          </div>
          {isEmojiOpen && (
            <div className="card-comments-emoji-picker" role="listbox" aria-label={t('comments.reactionPicker')}>
              {emojiOptions.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className="card-comments-emoji-item"
                  onClick={() => appendEmoji(emoji)}
                  aria-label={emoji}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
