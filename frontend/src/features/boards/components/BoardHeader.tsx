import React, { useEffect, useMemo, useState } from 'react';
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
  onOpenMembersPanel: () => void;
  closeSignal?: number;
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
  onOpenMenu,
  onOpenMembersPanel,
  closeSignal = 0
}) => {
  const { t } = useI18n();
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false);
  const [membersPanelQuery, setMembersPanelQuery] = useState('');
  const currentUserEntry = headerMembers.find(item => item.user.id === currentUserId);
  const currentUserProfile = currentUserEntry?.user;
  const currentUserName = currentUserProfile ? getMemberDisplayName(currentUserProfile) : t('nav.profile');
  const currentUserInitial = currentUserName.charAt(0).toUpperCase();
  const favoriteActionLabel = board.is_favorite ? 'Remove from favorites' : 'Add to favorites';
  const normalizedMembersQuery = membersPanelQuery.trim().toLowerCase();

  const filteredHeaderMembers = useMemo(() => {
    if (!normalizedMembersQuery) return headerMembers;
    return headerMembers.filter(({ user }) => {
      const name = getMemberDisplayName(user).toLowerCase();
      const username = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(normalizedMembersQuery)
        || username.includes(normalizedMembersQuery)
        || email.includes(normalizedMembersQuery);
    });
  }, [getMemberDisplayName, headerMembers, normalizedMembersQuery]);

  const workspaceParticipants = useMemo(
    () =>
      filteredHeaderMembers.filter(entry =>
        entry.user.id === ownerId || (entry.membership?.role || 'viewer') !== 'viewer'
      ),
    [filteredHeaderMembers, ownerId]
  );
  const guestParticipants = useMemo(
    () =>
      filteredHeaderMembers.filter(entry =>
        entry.user.id !== ownerId && (entry.membership?.role || 'viewer') === 'viewer'
      ),
    [filteredHeaderMembers, ownerId]
  );

  useEffect(() => {
    if (headerMemberId) {
      setIsMembersPanelOpen(false);
    }
  }, [headerMemberId]);

  useEffect(() => {
    if (!isMembersPanelOpen) {
      setMembersPanelQuery('');
    }
  }, [isMembersPanelOpen]);

  useEffect(() => {
    if (!closeSignal) return;
    setIsMembersPanelOpen(false);
    setMembersPanelQuery('');
  }, [closeSignal]);

  return (
    <>
      {headerMemberId && (
        <div className="board-member-popover-overlay" onClick={onCloseHeaderMember} />
      )}
      {isMembersPanelOpen && (
        <button
          type="button"
          className="board-members-panel-overlay"
          onClick={() => setIsMembersPanelOpen(false)}
          aria-label={t('common.close')}
        />
      )}
      <div className={`board-header ${headerMemberId ? 'member-popover-open' : ''}`}>
        <div className="board-header-main">
          <div className="board-global-menu">
            <button
              className="btn-icon board-global-menu-trigger"
              onClick={onToggleGlobalMenu}
              aria-label={t('nav.menu')}
              aria-expanded={isGlobalMenuOpen}
              aria-haspopup="menu"
            >
              ☰
            </button>
            {isGlobalMenuOpen && (
              <>
                <div className="board-global-menu-overlay" onClick={onCloseGlobalMenu} />
                <div className="board-global-menu-dropdown" role="menu" aria-label={t('nav.menu')}>
                  <Link to="/boards" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.board')}
                  </Link>
                  <Link to="/my-cards" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.myCards')}
                  </Link>
                  <Link to="/help" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.help')}
                  </Link>
                  <Link to="/community" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.community')}
                  </Link>
                  <div className="board-global-menu-divider" />
                  <div className="board-global-menu-lang">
                    <LanguageSelect compact />
                  </div>
                  <Link to="/profile" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.profile')}
                  </Link>
                  <button
                    type="button"
                    className="board-global-menu-item board-global-menu-button"
                    role="menuitem"
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
          <Link to="/boards" className="btn-icon board-back-btn" aria-label={t('nav.board')}>←</Link>
          <div className="board-icon" aria-hidden="true">
            {!boardIconFailed ? (
              <img src={boardIconSrc} alt="" decoding="async" onError={onBoardIconError} />
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
            aria-label={favoriteActionLabel}
            title={favoriteActionLabel}
            aria-pressed={board.is_favorite}
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
                      aria-label={`${displayName} (${roleLabel})`}
                    >
                      <div className="board-member-avatar">
                        <img
                          src={getAvatarSrc(member.profile)}
                          alt={displayName}
                          loading="lazy"
                          decoding="async"
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
                              loading="lazy"
                              decoding="async"
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
                            aria-label={t('common.close')}
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
                              <label
                                className="member-popover-action"
                                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('members.roleLabel')}</span>
                                <select
                                  className="form-input"
                                  value={membership.role}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    onToggleMemberRole(membership, e.target.value as 'admin' | 'developer' | 'viewer');
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
              <div className="board-members-panel-wrapper">
                <button
                  type="button"
                  className="board-members-panel-trigger"
                  onClick={() => {
                    onToggleHeaderMember(null);
                    setIsMembersPanelOpen(prev => {
                      const next = !prev;
                      if (next) onOpenMembersPanel();
                      return next;
                    });
                  }}
                  aria-expanded={isMembersPanelOpen}
                  aria-label={t('members.modalTitle')}
                >
                  +
                </button>

                {isMembersPanelOpen && (
                  <div className="board-members-panel" onClick={(e) => e.stopPropagation()}>
                    <div className="board-members-panel-header">
                      <span>✦ {t('members.modalTitle')}</span>
                      <button
                        type="button"
                        className="board-members-panel-close"
                        onClick={() => setIsMembersPanelOpen(false)}
                        aria-label={t('common.close')}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="board-members-panel-search">
                      <span>⌕</span>
                      <input
                        value={membersPanelQuery}
                        onChange={(e) => setMembersPanelQuery(e.target.value)}
                        placeholder={`${t('common.search')}...`}
                        aria-label={t('common.search')}
                      />
                    </div>

                    <div className="board-members-panel-section">
                      <div className="board-members-panel-label">{t('members.workspaceParticipants')}</div>
                      <div className="board-members-panel-avatars">
                        {workspaceParticipants.map(({ user: memberUser }) => {
                          const name = getMemberDisplayName(memberUser);
                          return (
                            <button
                              key={`workspace-${memberUser.id}`}
                              type="button"
                              className="board-members-panel-avatar"
                              title={name}
                              onClick={() => {
                                setIsMembersPanelOpen(false);
                                onToggleHeaderMember(memberUser.id);
                              }}
                            >
                              <img
                                src={getAvatarSrc(memberUser.profile)}
                                alt={name}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  if (e.currentTarget.src !== fallbackAvatar) {
                                    e.currentTarget.src = fallbackAvatar;
                                  }
                                }}
                              />
                            </button>
                          );
                        })}
                        {workspaceParticipants.length === 0 && (
                          <span className="board-members-panel-empty">—</span>
                        )}
                      </div>
                    </div>

                    <div className="board-members-panel-section">
                      <div className="board-members-panel-label">{t('members.guests')}</div>
                      <div className="board-members-panel-avatars">
                        {guestParticipants.map(({ user: memberUser }) => {
                          const name = getMemberDisplayName(memberUser);
                          return (
                            <button
                              key={`guest-${memberUser.id}`}
                              type="button"
                              className="board-members-panel-avatar"
                              title={name}
                              onClick={() => {
                                setIsMembersPanelOpen(false);
                                onToggleHeaderMember(memberUser.id);
                              }}
                            >
                              <img
                                src={getAvatarSrc(memberUser.profile)}
                                alt={name}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  if (e.currentTarget.src !== fallbackAvatar) {
                                    e.currentTarget.src = fallbackAvatar;
                                  }
                                }}
                              />
                            </button>
                          );
                        })}
                        {guestParticipants.length === 0 && (
                          <span className="board-members-panel-empty">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="board-header-search">
            <input
              className="form-input board-search-input"
              placeholder={t('toolbar.searchPlaceholder')}
              value={filterQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={t('toolbar.searchPlaceholder')}
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
              className="board-account-trigger"
              onClick={onOpenMenu}
              aria-haspopup="menu"
              aria-label={t('board.menu')}
              title={currentUserName}
            >
              {currentUserProfile ? (
                <img
                  src={getAvatarSrc(currentUserProfile.profile)}
                  alt={currentUserName}
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== fallbackAvatar) {
                      e.currentTarget.src = fallbackAvatar;
                    }
                  }}
                />
              ) : (
                <span>{currentUserInitial || boardIconLetter}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
