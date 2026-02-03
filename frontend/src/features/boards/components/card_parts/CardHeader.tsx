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
  onOpenCover?: () => void;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  card, board, canEdit, onUpdateCard, onCopyLink, onClose, onCopyCard, onArchiveToggle, onDeleteCard, onMoveCard, onOpenCover
}) => {
  const { t, locale } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
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
  const dueDate = card.due_date ? new Date(card.due_date) : null;
  const dueText = dueDate && !Number.isNaN(dueDate.getTime())
    ? dueDate.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

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
  return (
    <div className="card-modal-header">
      <div className="card-modal-header-main">
        <input 
            className="card-title-input"
            value={card.title}
            onChange={e => onUpdateCard({ title: e.target.value })}
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? 'text' : 'not-allowed' }}
        />
        <div className="card-meta-row">
            {t('card.inList')}: <strong>{listTitle}</strong>
        </div>
        {dueText && (
          <div className="card-meta-row">
            {t('card.dueDate')}: <strong>{dueText}</strong>
          </div>
        )}
        
        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
            {card.members && card.members.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 4 }}>{t('card.members')}:</span>
                    {card.members.map(member => (
                        <div key={member.id} className="member-avatar" style={{width: 24, height: 24, fontSize: 10}} title={member.username}>
                            {member.username[0].toUpperCase()}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
      <div className="card-modal-header-actions">
        <button
          className="btn-icon card-header-icon"
          onClick={onOpenCover}
          title={t('card.cover.title')}
          aria-label={t('card.cover.title')}
        >
          🖼️
        </button>
        <button
          className={`btn-icon card-header-icon ${isWatching ? 'active' : ''}`}
          onClick={() => setIsWatching(prev => !prev)}
          title={t('card.watch')}
          aria-label={t('card.watch')}
        >
          👁️
        </button>
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
              <div className="card-menu-overlay" onClick={() => { setIsMenuOpen(false); setIsMoveOpen(false); }} />
              <div className="card-menu-dropdown">
                <button className="card-menu-item" onClick={() => setIsMoveOpen(prev => !prev)}>
                  ➜ {t('card.menu.move')}
                </button>
                <button className="card-menu-item" onClick={() => { onCopyCard(); setIsMenuOpen(false); setIsMoveOpen(false); }}>
                  📋 {t('card.menu.copy')}
                </button>
                <button className="card-menu-item" onClick={() => { onCopyLink(); setIsMenuOpen(false); setIsMoveOpen(false); }}>
                  🔗 {t('card.menu.share')}
                </button>
                <button className="card-menu-item" onClick={() => { onArchiveToggle(); setIsMenuOpen(false); setIsMoveOpen(false); }}>
                  📦 {t('card.menu.archive')}
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
                  🗑️ {t('card.menu.delete')}
                </button>
              </div>
              {isMoveOpen && (
                <div className="card-move-popover">
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
              )}
            </>
          )}
        </div>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>
    </div>
  );
};
