import React from 'react';
import { FiX } from 'shared/ui/fiIcons';
import { type MembersSectionProps } from './types';

export const MembersSection: React.FC<MembersSectionProps> = ({
  t,
  board,
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
  canManageMembers,
  currentUserId,
}) => {
  return (
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
        {filteredMembers.map((member) => {
          const isOwnerMember = member.user.id === board.owner?.id;
          const isAdminMember = isOwnerMember || member.role === 'admin';
          const displayName = getMemberDisplayName(member.user);
          const roleLabel = isOwnerMember
            ? t('members.roleOwner')
            : isAdminMember
              ? t('members.roleAdmin')
              : member.role === 'developer'
                ? t('members.roleDeveloper')
                : t('members.roleViewer');
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
                    loading="lazy"
                    decoding="async"
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
                      <div className="member-popover-email">{member.user.email}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-icon member-popover-close"
                      onClick={() => onToggleActiveMember(null)}
                      aria-label={t('common.close')}
                    >
                      <FiX aria-hidden="true" />
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
                    <label className="member-popover-action" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('members.roleLabel')}</span>
                      <select
                        className="form-input"
                        value={member.role}
                        onChange={(e) => onToggleMemberRole(member, e.target.value as 'admin' | 'developer' | 'viewer')}
                      >
                        <option value="admin">{t('members.roleAdmin')}</option>
                        <option value="developer">{t('members.roleDeveloper')}</option>
                        <option value="viewer">{t('members.roleViewer')}</option>
                      </select>
                    </label>
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
  );
};
