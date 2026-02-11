import React from 'react';
import { Link } from 'react-router-dom';
import { LanguageSelect } from '../../../components/LanguageSelect';
import { useI18n } from '../../../context/I18nContext';
import { Board, User } from '../../../types';

type BoardMember = NonNullable<Board['members']>[number];
type HeaderMember = { user: User; membership?: BoardMember };

interface BoardHeaderProps {
  board: Board;
  boardTitle: string;
  canEditBoard: boolean;
  onBoardTitleChange: (value: string) => void;
  onBoardTitleBlur: () => void;
  onToggleFavorite: () => void;
  boardIconSrc: string;
  boardIconLetter: string;
  boardIconFailed: boolean;
  onBoardIconError: () => void;
  isGlobalMenuOpen: boolean;
  onToggleGlobalMenu: () => void;
  onCloseGlobalMenu: () => void;
  onLogout: () => void;
  headerMembers: HeaderMember[];
  visibleMembers: User[];
  extraMembersCount: number;
  headerMemberId: number | null;
  onToggleHeaderMember: (id: number | null) => void;
  onCloseHeaderMember: () => void;
  getAvatarSrc: (profile?: { avatar_url?: string | null; avatar?: string | null }) => string;
  fallbackAvatar: string;
  getMemberDisplayName: (user: User) => string;
  canManageMembers: boolean;
  ownerId?: number;
  currentUserId?: number;
  onOpenMemberActivity: (member: BoardMember) => void;
  onToggleMemberRole: (member: BoardMember, role: 'admin' | 'developer' | 'viewer') => void;
  onRemoveMember: (membershipId: number) => void;
  filterQuery: string;
  onSearchChange: (value: string) => void;
  onOpenFilter: () => void;
  onOpenMenu: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  boardTitle,
  canEditBoard,
  onBoardTitleChange,
  onBoardTitleBlur,
  onToggleFavorite,
  boardIconSrc,
  boardIconLetter,
  boardIconFailed,
  onBoardIconError,
  isGlobalMenuOpen,
  onToggleGlobalMenu,
  onCloseGlobalMenu,
  onLogout,
  headerMembers,
  visibleMembers,
  extraMembersCount,
  headerMemberId,
  onToggleHeaderMember,
  onCloseHeaderMember,
  getAvatarSrc,
  fallbackAvatar,
  getMemberDisplayName,
  canManageMembers,
  ownerId,
  currentUserId,
  onOpenMemberActivity,
  onToggleMemberRole,
  onRemoveMember,
  filterQuery,
  onSearchChange,
  onOpenFilter,
  onOpenMenu
}) => {
  const { t } = useI18n();

  return (
    <>
      {headerMemberId && (
        <div className="board-member-popover-overlay" onClick={onCloseHeaderMember} />
      )}
      <div className="board-header">
        <div className="board-header-main">
          <div className="board-global-menu">
            <button
              className="btn-icon board-global-menu-trigger"
              onClick={onToggleGlobalMenu}
              aria-label={t('nav.menu')}
              aria-expanded={isGlobalMenuOpen}
            >
              ☰
            </button>
            {isGlobalMenuOpen && (
              <>
                <div className="board-global-menu-overlay" onClick={onCloseGlobalMenu} />
                <div className="board-global-menu-dropdown">
                  <Link to="/boards" className="board-global-menu-item" onClick={onCloseGlobalMenu}>
                    {t('nav.board')}
                  </Link>
                  <Link to="/my-cards" className="board-global-menu-item" onClick={onCloseGlobalMenu}>
                    {t('nav.myCards')}
                  </Link>
                  <Link to="/help" className="board-global-menu-item" onClick={onCloseGlobalMenu}>
                    {t('nav.help')}
                  </Link>
                  <Link to="/community" className="board-global-menu-item" onClick={onCloseGlobalMenu}>
                    {t('nav.community')}
                  </Link>
                  <div className="board-global-menu-divider" />
                  <div className="board-global-menu-lang">
                    <LanguageSelect compact />
                  </div>
                  <Link to="/profile" className="board-global-menu-item" onClick={onCloseGlobalMenu}>
                    {t('nav.profile')}
                  </Link>
                  <button
                    type="button"
                    className="board-global-menu-item board-global-menu-button"
                    onClick={() => {
                      onLogout();
                      onCloseGlobalMenu();
                    }}
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
          <Link to="/boards" className="btn-icon board-back-btn">←</Link>
          <div className="board-icon" aria-hidden="true">
            {!boardIconFailed ? (
              <img src={boardIconSrc} alt="" onError={onBoardIconError} />
            ) : (
              <span>{boardIconLetter}</span>
            )}
          </div>
          <input 
            value={boardTitle}
            onChange={(e) => { if (canEditBoard) onBoardTitleChange(e.target.value); }}
            onBlur={() => { if (canEditBoard) onBoardTitleBlur(); }}
            readOnly={!canEditBoard}
            className="board-title-input"
            style={{ background: 'transparent', border: 'none', fontSize: '18px', fontWeight: 'bold', width: 'auto', minWidth: '100px' }}
          />
          <button 
            onClick={onToggleFavorite} 
            className="btn-icon" 
            style={{ color: board.is_favorite ? '#FFC107' : 'var(--text-secondary)', fontSize: '20px' }}
          >
            {board.is_favorite ? '★' : '☆'}
          </button>
        </div>
        <Link to="/boards" className="board-header-brand">Boardly</Link>
        <div className="board-header-toolbar">
          {(visibleMembers.length > 0 || extraMembersCount > 0) && (
            <div className="board-header-members" aria-label={t('members.modalTitle')}>
              {visibleMembers.map(member => {
                const entry = headerMembers.find(item => item.user.id === member.id);
                const membership = entry?.membership;
                const displayName = getMemberDisplayName(member);
                const roleLabel = member.id === ownerId
                  ? t('members.roleOwner')
                  : membership?.role === 'admin'
                  ? t('members.roleAdmin')
                  : membership?.role === 'developer'
                  ? t('members.roleDeveloper')
                  : t('members.roleViewer');
                const isActive = headerMemberId === member.id;
                return (
                  <div className="board-member-button" key={`member-${member.id}`}>
                    <button
                      type="button"
                      className="board-member-trigger"
                      onClick={() => onToggleHeaderMember(isActive ? null : member.id)}
                      title={displayName}
                      aria-expanded={isActive}
                    >
                      <div className="board-member-avatar">
                        <img
                          src={getAvatarSrc(member.profile)}
                          alt={displayName}
                          onError={(e) => {
                            if (e.currentTarget.src !== fallbackAvatar) {
                              e.currentTarget.src = fallbackAvatar;
                            }
                          }}
                        />
                      </div>
                    </button>
                    {isActive && (
                      <div className="member-popover board-member-popover" onClick={(e) => e.stopPropagation()}>
                        <div className="member-popover-header">
                          <div className="member-avatar">
                            <img
                              src={getAvatarSrc(member.profile)}
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
                            <div className="member-popover-email">{member.email}</div>
                            <div className="member-role">{roleLabel}</div>
                          </div>
                          <button
                            type="button"
                            className="btn-icon member-popover-close"
                            onClick={onCloseHeaderMember}
                          >
                            ✕
                          </button>
                        </div>
                        {membership && (
                          <>
                            <button
                              type="button"
                              className="member-popover-action"
                              onClick={() => {
                                onOpenMemberActivity(membership);
                                onCloseHeaderMember();
                              }}
                            >
                              {t('members.viewActivity')}
                            </button>
                            {canManageMembers && member.id !== ownerId && (
                              <label className="member-popover-action" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('members.roleLabel')}</span>
                                <select
                                  className="form-input"
                                  value={membership.role}
                                  onChange={(e) => {
                                    onToggleMemberRole(membership, e.target.value as 'admin' | 'developer' | 'viewer');
                                    onCloseHeaderMember();
                                  }}
                                >
                                  <option value="admin">{t('members.roleAdmin')}</option>
                                  <option value="developer">{t('members.roleDeveloper')}</option>
                                  <option value="viewer">{t('members.roleViewer')}</option>
                                </select>
                              </label>
                            )}
                            {canManageMembers && member.id !== currentUserId && member.id !== ownerId && (
                              <button
                                type="button"
                                className="member-popover-action danger"
                                onClick={() => {
                                  onRemoveMember(membership.id);
                                  onCloseHeaderMember();
                                }}
                              >
                                {t('members.removeFromBoard')}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {extraMembersCount > 0 && (
                <div className="board-member-button" aria-hidden="true">
                  <div className="board-member-avatar board-member-count">+{extraMembersCount}</div>
                </div>
              )}
            </div>
          )}
          <div className="board-header-search">
            <input
              className="form-input board-search-input"
              placeholder={t('toolbar.searchPlaceholder')}
              value={filterQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="board-header-actions">
            <button
              className="btn-secondary board-header-action"
              onClick={onOpenFilter}
              aria-label={t('board.filters')}
            >
              <span className="board-header-action-icon">🔎</span>
              <span className="board-header-action-label">{t('board.filters')}</span>
            </button>
            <button
              className="btn-secondary board-header-action"
              onClick={onOpenMenu}
              aria-label={t('board.menu')}
            >
              <span className="board-header-action-icon">•••</span>
              <span className="board-header-action-label">{t('board.menu')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
