import React, { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiSearch, FiStar, FiX } from 'shared/ui/fiIcons';
import { useI18n } from '../../../../context/I18nContext';
import { type Board, type User } from '../../../../types';

type BoardMember = NonNullable<Board['members']>[number];
type HeaderMember = { user: User; membership?: BoardMember };

type BoardHeaderMembersProps = {
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
  onOpenMembersPanel: () => void;
  closeSignal: number;
};

export const BoardHeaderMembers: React.FC<BoardHeaderMembersProps> = ({
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
  onOpenMembersPanel,
  closeSignal,
}) => {
  const { t } = useI18n();
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false);
  const [membersPanelQuery, setMembersPanelQuery] = useState('');
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
      filteredHeaderMembers.filter((entry) =>
        entry.user.id === ownerId || (entry.membership?.role || 'viewer') !== 'viewer'
      ),
    [filteredHeaderMembers, ownerId]
  );
  const guestParticipants = useMemo(
    () =>
      filteredHeaderMembers.filter((entry) =>
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

  if (visibleMembers.length === 0 && extraMembersCount === 0) {
    return null;
  }

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
      <div className="board-header-members" aria-label={t('members.modalTitle')}>
        {visibleMembers.map((member) => {
          const entry = headerMembers.find((item) => item.user.id === member.id);
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
                      <FiX aria-hidden="true" />
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
              setIsMembersPanelOpen((prev) => {
                const next = !prev;
                if (next) onOpenMembersPanel();
                return next;
              });
            }}
            aria-expanded={isMembersPanelOpen}
            aria-label={t('members.modalTitle')}
            >
            <FiPlus aria-hidden="true" />
            </button>

          {isMembersPanelOpen && (
            <div className="board-members-panel" onClick={(e) => e.stopPropagation()}>
              <div className="board-members-panel-header">
                <span><FiStar aria-hidden="true" /> {t('members.modalTitle')}</span>
                <button
                  type="button"
                  className="board-members-panel-close"
                  onClick={() => setIsMembersPanelOpen(false)}
                  aria-label={t('common.close')}
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>

              <div className="board-members-panel-search">
                <span><FiSearch aria-hidden="true" /></span>
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
    </>
  );
};
