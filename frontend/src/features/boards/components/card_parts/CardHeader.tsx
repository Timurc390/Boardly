import React, { useEffect, useMemo, useState } from 'react';
import { Card, Board } from '../../../../types';
import { useI18n } from '../../../../context/I18nContext';

interface CardHeaderProps {
  card: Card;
  board: Board;
  canEdit: boolean;
  onUpdateCard: (data: Partial<Card>) => void;
  onCopyLink: () => void;
  onClose: () => void;
  onCopyCard: () => void;
  onArchiveToggle: () => void;
  onDeleteCard: () => void;
  onMoveCard?: (cardId: number, sourceListId: number, destListId: number, destIndex: number) => void;
  isCardMember?: boolean;
  onJoinCard?: () => void;
  onLeaveCard?: () => void;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  card, board, canEdit, onUpdateCard, onCopyLink, onClose, onCopyCard, onArchiveToggle, onDeleteCard, onMoveCard,
  isCardMember = false, onJoinCard, onLeaveCard
}) => {
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const activeLists = useMemo(() => board.lists?.filter(l => !l.is_archived) || [], [board.lists]);
  const currentList = activeLists.find(l => l.id === card.list);
  const currentIndex = currentList?.cards?.findIndex(c => c.id === card.id) ?? 0;
  const [moveListId, setMoveListId] = useState(card.list);
  const [movePosition, setMovePosition] = useState(currentIndex + 1);

  useEffect(() => {
    setMoveListId(card.list);
    setMovePosition(currentIndex + 1);
  }, [card.id, card.list, currentIndex]);
  const listTitle = board.lists?.find(l => l.id === card.list)?.title || t('common.unknown');
  const fallbackAvatar = '/board-avatars/ava-anto-treklo.png';
  const getAvatarSrc = (member: NonNullable<Card['members']>[number]) => {
    const candidate = member?.profile?.avatar_url || member?.profile?.avatar || '';
    if (!candidate) return fallbackAvatar;
    if (candidate.startsWith('data:') || candidate.startsWith('http') || candidate.startsWith('/')) return candidate;
    return `/${candidate}`;
  };
  const selectedList = activeLists.find(l => l.id === moveListId) || currentList || activeLists[0];
  const maxPosition = Math.max(1, (selectedList?.cards?.filter(c => !c.is_archived).length || 1));
  const positions = Array.from({ length: maxPosition }, (_, idx) => idx + 1);

  useEffect(() => {
    setMovePosition(prev => Math.min(prev, maxPosition));
  }, [maxPosition]);

  const handleMove = () => {
    if (!onMoveCard || !selectedList) return;
    const destIndex = Math.max(0, Math.min(maxPosition - 1, movePosition - 1));
    onMoveCard(card.id, card.list, selectedList.id, destIndex);
    setIsMoveOpen(false);
    setIsMenuOpen(false);
  };

  const renderMovePopover = (className = '') => (
    <div className={`card-move-popover ${className}`.trim()}>
      <div className="card-move-title">{t('card.move.title')}</div>
      <label className="card-move-label">
        {t('card.move.list')}
        <select
          className="form-input"
          value={moveListId}
          onChange={(e) => setMoveListId(Number(e.target.value))}
        >
          {activeLists.map(list => (
            <option key={list.id} value={list.id}>{list.title}</option>
          ))}
        </select>
      </label>
      <label className="card-move-label">
        {t('card.move.position')}
        <select
          className="form-input"
          value={Math.min(movePosition, maxPosition)}
          onChange={(e) => setMovePosition(Number(e.target.value))}
        >
          {positions.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </label>
      <button type="button" className="btn-primary btn-sm card-move-btn" onClick={handleMove}>
        {t('card.move.button')}
      </button>
    </div>
  );

  return (
    <div className="card-modal-header">
      <div className="card-modal-header-top">
        <div className="card-list-pill-wrapper">
          <button
            type="button"
            className="card-list-pill"
            title={listTitle}
            onClick={() => {
              setIsMenuOpen(false);
              setIsMoveOpen(prev => !prev);
            }}
          >
            {listTitle}
            <span className="card-list-pill-caret">▾</span>
          </button>
          {isMoveOpen && !isMenuOpen && renderMovePopover('card-list-move-popover')}
        </div>
        {(isMenuOpen || isMoveOpen) && (
          <div className="card-menu-overlay" onClick={() => { setIsMenuOpen(false); setIsMoveOpen(false); }} />
        )}
        <div className="card-modal-header-actions">
          <div className="card-menu-wrapper">
            <button
              className="btn-icon card-menu-trigger"
              onClick={() => setIsMenuOpen(prev => !prev)}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              title={t('card.menu')}
            >
              •••
            </button>
            {isMenuOpen && (
              <>
                <div className="card-menu-dropdown">
                  <button
                    className="card-menu-item"
                    onClick={() => {
                      if (isCardMember) onLeaveCard?.();
                      else onJoinCard?.();
                      setIsMenuOpen(false);
                      setIsMoveOpen(false);
                    }}
                  >
                    <span className="card-menu-icon">🙋‍♂️</span>
                    {isCardMember ? t('card.sidebar.leave') : t('card.sidebar.join')}
                  </button>
                  <button className="card-menu-item" onClick={() => setIsMoveOpen(prev => !prev)}>
                    <span className="card-menu-icon">➜</span>
                    {t('card.menu.move')}
                  </button>
                  <button className="card-menu-item" onClick={() => { onCopyCard(); setIsMenuOpen(false); setIsMoveOpen(false); }}>
                    <span className="card-menu-icon">📋</span>
                    {t('card.menu.copy')}
                  </button>
                  <button className="card-menu-item" onClick={() => { onCopyLink(); setIsMenuOpen(false); setIsMoveOpen(false); }}>
                    <span className="card-menu-icon">🪞</span>
                    {t('card.menu.mirror')}
                  </button>
                  <button className="card-menu-item" onClick={() => { onCopyCard(); setIsMenuOpen(false); setIsMoveOpen(false); }}>
                    <span className="card-menu-icon">📄</span>
                    {t('card.menu.template')}
                  </button>
                  <button className="card-menu-item" onClick={() => { onCopyLink(); setIsMenuOpen(false); setIsMoveOpen(false); }}>
                    <span className="card-menu-icon">🔗</span>
                    {t('card.menu.share')}
                  </button>
                  <button className="card-menu-item" onClick={() => { onArchiveToggle(); setIsMenuOpen(false); setIsMoveOpen(false); }}>
                    <span className="card-menu-icon">📦</span>
                    {t('card.menu.archive')}
                  </button>
                  <div className="card-menu-divider" />
                  <button
                    className="card-menu-item danger"
                    onClick={() => {
                      if (window.confirm(t('confirm.deleteCard'))) {
                        onDeleteCard();
                        setIsMenuOpen(false);
                        setIsMoveOpen(false);
                      }
                    }}
                  >
                    <span className="card-menu-icon">🗑️</span>
                    {t('card.menu.delete')}
                  </button>
                </div>
                {isMoveOpen && renderMovePopover()}
              </>
            )}
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="card-modal-header-main">
        <div className="card-title-row">
          <button
            type="button"
            className={`card-status-toggle ${card.is_completed ? 'done' : ''}`}
            aria-label={card.is_completed ? t('card.uncomplete') : t('card.complete')}
            onClick={() => canEdit && onUpdateCard({ is_completed: !card.is_completed })}
            disabled={!canEdit}
          >
            {card.is_completed ? '✓' : '○'}
          </button>
          <input 
              className="card-title-input"
              value={card.title}
              onChange={e => onUpdateCard({ title: e.target.value })}
              disabled={!canEdit}
              style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? 'text' : 'not-allowed' }}
          />
        </div>
        <div className="card-member-row-inline">
            {card.members && card.members.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 4 }}>{t('card.members')}:</span>
                    {card.members.map(member => (
                        <div key={member.id} className="member-avatar card-member-avatar-mini" title={member.username}>
                            <img
                              src={getAvatarSrc(member)}
                              alt={member.username}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
                              }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
