import React from 'react';
import { FiArchive, FiCopy, FiImage, FiTrash2, FiUserPlus, FiX } from 'shared/ui/fiIcons';
import { Card } from '../../../../types';
import { Button } from '../../../../components/ui/Button';
import { useI18n } from '../../../../context/I18nContext';
import { confirmAction } from '../../../../shared/utils/confirm';
import { resolveMediaUrl } from '../../../../utils/mediaUrl';

interface CardSidebarProps {
  card: Card;
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
  isCardMember: boolean | undefined;
  canManageMembers: boolean;
  canJoinCard: boolean;
  canLeaveCard: boolean;
  onJoinCard: () => void;
  onLeaveCard: () => void;
  onRemoveMember: (userId: number) => void;
  startEditingDueDate: () => void;
  onCopyCard: () => void;
  onUpdateCard: (data: Partial<Card>) => void;
  onDeleteCard: () => void;
  isEditingDueDate: boolean;
  dueDateDate: string;
  dueDateTime: string;
  setDueDateDate: (val: string) => void;
  setDueDateTime: (val: string) => void;
  saveDueDate: () => void;
  removeDueDate: () => void;
  closeDueDateEdit: () => void;
  isCoverMenuOpen: boolean;
  onToggleCoverMenu: () => void;
  coverMode: 'full' | 'header';
  onCoverModeChange: (mode: 'full' | 'header') => void;
  onOpenCover: () => void;
}

export const CardSidebar: React.FC<CardSidebarProps> = ({ 
  card, canEdit, canArchive, canDelete, isCardMember, canManageMembers, canJoinCard, canLeaveCard,
  onJoinCard, onLeaveCard, onRemoveMember, startEditingDueDate,
  onCopyCard, onUpdateCard, onDeleteCard,
  isEditingDueDate, dueDateDate, dueDateTime, setDueDateDate, setDueDateTime, saveDueDate, removeDueDate, closeDueDateEdit,
  isCoverMenuOpen, onToggleCoverMenu, coverMode, onCoverModeChange, onOpenCover
}) => {
  const { t, locale } = useI18n();
  const fallbackAvatar = '/logo.png';
  const getAvatarSrc = (member: NonNullable<Card['members']>[number]) => {
    return resolveMediaUrl(member?.profile?.avatar_url || member?.profile?.avatar, fallbackAvatar);
  };
  const coverColors = [
    '#4CAF50',
    '#FBC02D',
    '#E53935',
    '#1E88E5',
    '#9E9E9E',
    '#F5F5F5',
    '#FB8C00',
    '#8E24AA',
    '#00897B',
    '#8D6E63'
  ];
  const dueDate = card.due_date ? new Date(card.due_date) : null;
  const dueText = dueDate && !Number.isNaN(dueDate.getTime())
    ? dueDate.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
  const previewDate = dueDateDate
    ? new Date(`${dueDateDate}T${dueDateTime || '12:00'}`)
    : null;
  const previewText = previewDate
    ? previewDate.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
  const canShowSidebar = canEdit || canManageMembers || canJoinCard || canLeaveCard;
  if (!canShowSidebar) return null;

  return (
    <div className="card-sidebar">
        {(canManageMembers || canJoinCard || canLeaveCard) && (
          <div className="card-sidebar-section">
            <h4 className="card-sidebar-title">{t('card.sidebar.participation')}</h4>
            {isCardMember ? (
              canLeaveCard ? (
                <button type="button" className="sidebar-btn btn-danger" onClick={(e) => { e.preventDefault(); onLeaveCard(); }}>
                  <span className="sidebar-btn-icon"><FiArchive aria-hidden="true" /></span>
                  {t('card.sidebar.leave')}
                </button>
              ) : null
            ) : (
              (card.is_public || canManageMembers) ? (
                canJoinCard ? (
                  <button type="button" className="sidebar-btn" onClick={(e) => { e.preventDefault(); onJoinCard(); }}>
                    <span className="sidebar-btn-icon"><FiUserPlus aria-hidden="true" /></span>
                    {t('card.sidebar.join')}
                  </button>
                ) : null
              ) : (
                <div style={{fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 8}}>{t('card.private')}</div>
              )
            )}
          </div>
        )}

        {card.members && card.members.length > 0 && (
          <div className="card-sidebar-section">
            <h4 className="card-sidebar-title">{t('card.members')}</h4>
            {card.members.map(member => (
              <div key={member.id} className="card-member-row">
                <div className="card-member-meta">
                  <div className="member-avatar card-member-avatar-sm" title={member.username || member.email}>
                    <img
                      src={getAvatarSrc(member)}
                      alt={member.username || member.email}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
                      }}
                    />
                  </div>
                  <div className="card-member-name">
                    {member.username || member.email}
                  </div>
                </div>
                {canManageMembers && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => onRemoveMember(member.id)}
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {canEdit && (
            <div className="card-sidebar-section">
                <h4 className="card-sidebar-title">{t('card.sidebar.add')}</h4>
                <div className="card-cover-block">
                  <button
                    type="button"
                    className="sidebar-btn"
                    onClick={() => {
                      if (isCoverMenuOpen) {
                        onToggleCoverMenu();
                      } else {
                        onOpenCover();
                      }
                    }}
                  >
                    <span className="sidebar-btn-icon"><FiImage aria-hidden="true" /></span>
                    {t('card.cover.title')}
                  </button>
                  {isCoverMenuOpen && (
                    <div className="card-cover-menu">
                      <div className="card-cover-menu-header">
                        <span>{t('card.cover.title')}</span>
                        <button type="button" className="btn-icon" onClick={onToggleCoverMenu} aria-label={t('common.close')}>
                          <FiX aria-hidden="true" />
                        </button>
                      </div>
                      <div className="card-cover-section">
                        <div className="card-cover-section-title">{t('card.cover.size')}</div>
                        <div className="card-cover-size-options">
                          <button
                            type="button"
                            className={`card-cover-size ${coverMode === 'full' ? 'active' : ''}`}
                            onClick={() => onCoverModeChange('full')}
                          >
                            <span className="card-cover-preview full" style={{ background: card.card_color || '#4b4f56' }} />
                            <span className="card-cover-size-label">{t('card.cover.size.full')}</span>
                          </button>
                          <button
                            type="button"
                            className={`card-cover-size ${coverMode === 'header' ? 'active' : ''}`}
                            onClick={() => onCoverModeChange('header')}
                          >
                            <span className="card-cover-preview header" style={{ background: card.card_color || '#4b4f56' }} />
                            <span className="card-cover-size-label">{t('card.cover.size.header')}</span>
                          </button>
                        </div>
                      </div>
                      <div className="card-cover-section">
                        <div className="card-cover-section-title">{t('card.cover.colors')}</div>
                        <div className="card-cover-swatches">
                          {coverColors.map(color => (
                            <button
                              key={color}
                              type="button"
                              className={`card-cover-swatch ${card.card_color === color ? 'active' : ''}`}
                              style={{ background: color }}
                              onClick={() => onUpdateCard({ card_color: color })}
                              aria-label={color}
                            />
                          ))}
                        </div>
                      </div>
                      {card.card_color && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm card-cover-remove"
                          onClick={() => onUpdateCard({ card_color: '' })}
                        >
                          {t('card.cover.remove')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {isEditingDueDate ? (
                    <div style={{background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 6, marginBottom: 8}}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <input
                            type="date"
                            className="form-input"
                            lang={locale}
                            value={dueDateDate}
                            onChange={e => setDueDateDate(e.target.value)}
                            style={{ fontSize: 12, flex: 1, minWidth: 140 }}
                          />
                          <input
                            type="time"
                            className="form-input"
                            lang={locale}
                            value={dueDateTime}
                            onChange={e => setDueDateTime(e.target.value)}
                            style={{ fontSize: 12, flex: 1, minWidth: 120 }}
                          />
                        </div>
                        {previewText && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            {t('card.dueDatePreview', { date: previewText })}
                          </div>
                        )}
                        <div style={{display:'flex', gap: 4}}>
                            <Button size="sm" onClick={saveDueDate}>{t('common.save')}</Button>
                            <button type="button" className="btn-secondary btn-sm" onClick={closeDueDateEdit}>{t('common.cancel')}</button>
                        </div>
                        <button type="button" className="btn-link" style={{fontSize:12, marginTop:4, color: 'var(--danger)'}} onClick={removeDueDate}>
                            {t('card.dueDateRemove')}
                        </button>
                    </div>
                ) : (
                    <button type="button" className="sidebar-btn" onClick={startEditingDueDate}>
                      <span className="sidebar-btn-icon">🕒</span>
                      <span>{t('card.dueDate')}</span>
                      {dueText && (
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {dueText}
                        </span>
                      )}
                    </button>
                )}
            </div>
        )}

        {canEdit && (
          <div className="card-sidebar-section">
            <h4 className="card-sidebar-title">{t('card.sidebar.actions')}</h4>
            <button type="button" className="sidebar-btn" onClick={(e) => { e.preventDefault(); onCopyCard(); }}>
              <span className="sidebar-btn-icon"><FiCopy aria-hidden="true" /></span>
              {t('card.copy')}
            </button>
            {canArchive && (
              <button type="button" className="sidebar-btn" onClick={() => onUpdateCard({is_archived: !card.is_archived})}>
                  <span className="sidebar-btn-icon"><FiArchive aria-hidden="true" /></span>
                  {card.is_archived ? t('card.unarchive') : t('card.archive')}
              </button>
            )}
            {canDelete && (
              <button type="button" className="sidebar-btn btn-danger" style={{color: 'var(--danger)'}} onClick={() => {
                  if (confirmAction(t('confirm.deleteCard'))) onDeleteCard();
              }}>
                <span className="sidebar-btn-icon"><FiTrash2 aria-hidden="true" /></span>
                {t('common.delete')}
              </button>
            )}
          </div>
        )}
    </div>
  );
};
