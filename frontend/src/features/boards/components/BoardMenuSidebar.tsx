import React from 'react';
import { Link } from 'react-router-dom';
import { LanguageSelect } from '../../../components/LanguageSelect';
import { useI18n } from '../../../context/I18nContext';
import { Board, Card, List } from '../../../types';

type BoardMember = NonNullable<Board['members']>[number];

type BackgroundOption = {
  key: string;
  value: string;
  label: string;
  preview?: string;
};

interface BoardMenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'main' | 'background' | 'members' | 'archived';
  onTabChange: (tab: 'main' | 'background' | 'members' | 'archived') => void;
  board: Board;
  inviteLink: string;
  onInvite: () => void;
  canEditBoard: boolean;
  canManageMembers: boolean;
  canLeaveBoard: boolean;
  isOwner: boolean;
  onArchiveToggle: () => void;
  onDeleteBoard: () => void;
  onLeaveBoard: () => void;
  onLogout: () => void;
  colorOptions: BackgroundOption[];
  gradientOptions: BackgroundOption[];
  imageOptions: BackgroundOption[];
  bgUrlInput: string;
  onBgUrlInputChange: (value: string) => void;
  onBackgroundSelect: (value: string) => void;
  onBackgroundFile: (file?: File | null) => void;
  memberQuery: string;
  onMemberQueryChange: (value: string) => void;
  filteredMembers: BoardMember[];
  activeMemberId: number | null;
  onToggleActiveMember: (id: number | null) => void;
  getMemberDisplayName: (user: BoardMember['user']) => string;
  getAvatarSrc: (profile?: { avatar_url?: string | null; avatar?: string | null }) => string;
  fallbackAvatar: string;
  onOpenMemberActivity: (member: BoardMember) => void;
  onToggleMemberRole: (member: BoardMember) => void;
  onRemoveMember: (membershipId: number) => void;
  currentUserId?: number;
  archivedLists: List[];
  archivedCards: Card[];
  onUnarchiveList: (listId: number) => void;
  onDeleteList: (listId: number) => void;
  onUnarchiveCard: (cardId: number) => void;
  onDeleteCard: (cardId: number) => void;
}

export const BoardMenuSidebar: React.FC<BoardMenuSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  board,
  inviteLink,
  onInvite,
  canEditBoard,
  canManageMembers,
  canLeaveBoard,
  isOwner,
  onArchiveToggle,
  onDeleteBoard,
  onLeaveBoard,
  onLogout,
  colorOptions,
  gradientOptions,
  imageOptions,
  bgUrlInput,
  onBgUrlInputChange,
  onBackgroundSelect,
  onBackgroundFile,
  memberQuery,
  onMemberQueryChange,
  filteredMembers,
  activeMemberId,
  onToggleActiveMember,
  getMemberDisplayName,
  getAvatarSrc,
  fallbackAvatar,
  onOpenMemberActivity,
  onToggleMemberRole,
  onRemoveMember,
  currentUserId,
  archivedLists,
  archivedCards,
  onUnarchiveList,
  onDeleteList,
  onUnarchiveCard,
  onDeleteCard
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="menu-sidebar-overlay" onClick={onClose}>
      <div className="menu-sidebar" onClick={e => e.stopPropagation()}>
        <div className="menu-header">
          {activeTab !== 'main' && <button className="btn-icon" onClick={() => onTabChange('main')}>←</button>}
          <h3>{t('board.menu')}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="menu-content">
          {activeTab === 'main' && (
            <>
              <ul className="menu-list">
                {canEditBoard && (
                  <li className="menu-list-item" onClick={() => onTabChange('background')}>
                    <span className="menu-item-icon">🖼️</span>
                    <span>{t('board.menu.changeBackground')}</span>
                  </li>
                )}
                <li className="menu-list-item" onClick={() => onTabChange('members')}>
                  <span className="menu-item-icon">👥</span>
                  <span>{t('board.menu.members')}</span>
                </li>
                {canEditBoard && (
                  <li className="menu-list-item" onClick={() => onTabChange('archived')}>
                    <span className="menu-item-icon">🗄️</span>
                    <span>{t('board.menu.archived')}</span>
                  </li>
                )}
              </ul>
              <div className="menu-divider"></div>
              <div className="menu-invite">
                <h4 className="menu-section-title">{t('board.menu.inviteTitle')}</h4>
                <div className="menu-invite-row">
                  <input className="form-input" readOnly value={inviteLink} style={{ fontSize: '12px', padding: '6px' }} />
                  <button className="btn-primary" style={{ width: 'auto', padding: '6px 12px' }} onClick={onInvite} disabled={!inviteLink}>
                    {t('board.menu.inviteTitle')}
                  </button>
                </div>
              </div>
              <div className="menu-divider"></div>
              {(canEditBoard || canLeaveBoard) && (
                <ul className="menu-list">
                  {canEditBoard && (
                    <li className="menu-list-item" onClick={onArchiveToggle}>
                      <span className="menu-item-icon">📦</span>
                      <span>{board.is_archived ? t('board.unarchive') : t('board.archive')}</span>
                    </li>
                  )}
                  {isOwner ? (
                    <li className="menu-list-item menu-list-item-danger" onClick={onDeleteBoard}>
                      <span className="menu-item-icon">🗑️</span>
                      <span>{t('board.delete')}</span>
                    </li>
                  ) : canLeaveBoard ? (
                    <li className="menu-list-item menu-list-item-danger" onClick={onLeaveBoard}>
                      <span className="menu-item-icon">🚪</span>
                      <span>{t('board.leave')}</span>
                    </li>
                  ) : null}
                </ul>
              )}
              <div className="menu-divider"></div>
              <div className="menu-nav">
                <h4 className="menu-section-title">{t('nav.menu')}</h4>
                <div className="menu-list">
                  <Link to="/boards" className="menu-list-item" onClick={onClose}>
                    {t('nav.board')}
                  </Link>
                  <Link to="/my-cards" className="menu-list-item" onClick={onClose}>
                    {t('nav.myCards')}
                  </Link>
                  <Link to="/help" className="menu-list-item" onClick={onClose}>
                    {t('nav.help')}
                  </Link>
                  <Link to="/community" className="menu-list-item" onClick={onClose}>
                    {t('nav.community')}
                  </Link>
                  <Link to="/profile" className="menu-list-item" onClick={onClose}>
                    {t('nav.profile')}
                  </Link>
                  <button
                    type="button"
                    className="menu-list-item menu-list-item-danger"
                    onClick={() => { onLogout(); onClose(); }}
                  >
                    {t('nav.logout')}
                  </button>
                </div>
                <div className="menu-language">
                  <span className="menu-section-title">{t('nav.language')}</span>
                  <LanguageSelect compact />
                </div>
              </div>
            </>
          )}
          {activeTab === 'background' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '0 12px' }}>
                <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{t('board.background.colors')}</h4>
                <div className="background-grid">
                  {colorOptions.map(option => {
                    const isSelected = option.value === (board.background_url || '');
                    return (
                      <button
                        key={option.key}
                        type="button"
                        className="btn-ghost"
                        onClick={() => onBackgroundSelect(option.value)}
                        title={option.label}
                        style={{
                          height: 48,
                          borderRadius: 10,
                          border: isSelected ? '2px solid var(--primary-blue)' : '1px solid rgba(255,255,255,0.15)',
                          background: option.preview || option.value || 'linear-gradient(135deg, #1f1f1f 0%, #2c2c2c 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          cursor: 'pointer'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div style={{ padding: '0 12px' }}>
                <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{t('board.background.gradients')}</h4>
                <div className="background-grid">
                  {gradientOptions.map(option => {
                    const isSelected = option.value === board.background_url;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        className="btn-ghost"
                        onClick={() => onBackgroundSelect(option.value)}
                        title={option.label}
                        style={{
                          height: 48,
                          borderRadius: 10,
                          border: isSelected ? '2px solid var(--primary-blue)' : '1px solid rgba(255,255,255,0.15)',
                          background: option.value,
                          cursor: 'pointer'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div style={{ padding: '0 12px' }}>
                <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{t('board.background.images')}</h4>
                <div className="background-grid">
                  {imageOptions.map(option => {
                    const isSelected = option.value === board.background_url;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        className="btn-ghost"
                        onClick={() => onBackgroundSelect(option.value)}
                        title={option.label}
                        aria-label={option.label}
                        style={{
                          height: 48,
                          borderRadius: 10,
                          border: isSelected ? '2px solid var(--primary-blue)' : '1px solid rgba(255,255,255,0.15)',
                          backgroundImage: `url(${option.value})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          cursor: 'pointer'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#888' }}>{t('board.background.imageSelected')}</label>
                <input
                  className="form-input"
                  placeholder={t('board.background.urlPlaceholder')}
                  value={bgUrlInput}
                  onChange={(e) => onBgUrlInputChange(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: 'auto' }}
                    onClick={() => {
                      if (bgUrlInput.trim()) onBackgroundSelect(bgUrlInput.trim());
                    }}
                  >
                    {t('board.background.apply')}
                  </button>
                  <label className="btn-secondary" style={{ width: 'auto' }}>
                    {t('board.background.upload')}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onBackgroundFile(e.target.files?.[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button type="button" className="btn-ghost" onClick={() => onBackgroundSelect('')}>
                    {t('board.background.reset')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'members' && (
            <div className="members-panel">
              <h4 className="menu-section-title">{t('members.modalTitle')}</h4>
              <input
                className="form-input members-search"
                placeholder={t('members.searchPlaceholder')}
                value={memberQuery}
                onChange={(e) => onMemberQueryChange(e.target.value)}
              />
              {filteredMembers.length === 0 && (
                <div className="members-empty">{t('members.empty')}</div>
              )}
              <div className="members-list">
                {filteredMembers.map(member => {
                  const isOwnerMember = member.user.id === board.owner?.id;
                  const isAdminMember = isOwnerMember || member.role === 'admin';
                  const displayName = getMemberDisplayName(member.user);
                  const roleLabel = isOwnerMember
                    ? t('members.roleOwner')
                    : isAdminMember
                    ? t('members.roleAdmin')
                    : t('members.roleMember');
                  const isActive = activeMemberId === member.id;
                  return (
                    <div key={member.id} className="member-row">
                      <button
                        type="button"
                        className="member-row-button"
                        onClick={() => onToggleActiveMember(isActive ? null : member.id)}
                      >
                        <div className="member-avatar">
                          <img
                            src={getAvatarSrc(member.user.profile)}
                            alt={displayName}
                            onError={(e) => {
                              if (e.currentTarget.src !== fallbackAvatar) {
                                e.currentTarget.src = fallbackAvatar;
                              }
                            }}
                          />
                        </div>
                        <div className="member-texts">
                          <div className="member-name">{displayName}</div>
                          <div className="member-role">{roleLabel}</div>
                        </div>
                      </button>
                      {isActive && (
                        <div className="member-popover">
                          <div className="member-popover-header">
                            <div className="member-avatar">
                              <img
                                src={getAvatarSrc(member.user.profile)}
                                alt={displayName}
                                onError={(e) => {
                                  if (e.currentTarget.src !== fallbackAvatar) {
                                    e.currentTarget.src = fallbackAvatar;
                                  }
                                }}
                              />
                            </div>
                            <div className="member-popover-info">
                              <div className="member-popover-name">{displayName}</div>
                              <div className="member-popover-email">{member.user.email}</div>
                            </div>
                            <button
                              type="button"
                              className="btn-icon member-popover-close"
                              onClick={() => onToggleActiveMember(null)}
                            >
                              ✕
                            </button>
                          </div>
                          <button
                            type="button"
                            className="member-popover-action"
                            onClick={() => onOpenMemberActivity(member)}
                          >
                            {t('members.viewActivity')}
                          </button>
                          {canManageMembers && !isOwnerMember && (
                            <button
                              type="button"
                              className="member-popover-action"
                              onClick={() => onToggleMemberRole(member)}
                            >
                              {member.role === 'admin' ? t('members.removeAdmin') : t('members.makeAdmin')}
                            </button>
                          )}
                          {canManageMembers && member.user.id !== currentUserId && !isOwnerMember && (
                            <button
                              type="button"
                              className="member-popover-action danger"
                              onClick={() => onRemoveMember(member.id)}
                            >
                              {t('members.removeFromBoard')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTab === 'archived' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 className="menu-section-title">{t('archive.lists')}</h4>
                {archivedLists.length === 0 && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t('list.empty.noneTitle')}</div>
                )}
                {archivedLists.map(list => (
                  <div key={list.id} className="archived-item">
                    <div className="archived-title">{list.title}</div>
                    <div className="archived-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => onUnarchiveList(list.id)}
                      >
                        {t('list.unarchive')}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => onDeleteList(list.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="menu-section-title">{t('archive.cards')}</h4>
                {archivedCards.length === 0 && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t('card.empty')}</div>
                )}
                {archivedCards.map(card => (
                  <div key={card.id} className="archived-item">
                    <div className="archived-title">
                      {card.title}
                      <span style={{ color: 'var(--text-secondary)', fontSize: 11, marginLeft: 6 }}>
                        {board.lists?.find(l => l.id === card.list)?.title}
                      </span>
                    </div>
                    <div className="archived-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => onUnarchiveCard(card.id)}
                      >
                        {t('card.unarchive')}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => onDeleteCard(card.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
