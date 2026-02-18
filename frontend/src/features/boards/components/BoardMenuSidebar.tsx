import React, { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { LanguageSelect } from '../../../components/LanguageSelect';
import { useI18n } from '../../../context/I18nContext';
import { Board, Card, List } from '../../../types';

type BoardMember = NonNullable<Board['members']>[number];

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
};

type BackgroundOption = {
  key: string;
  value: string;
  label: string;
  preview?: string;
};

interface BoardMenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'main' | 'background' | 'members' | 'archived' | 'permissions';
  onTabChange: (tab: 'main' | 'background' | 'members' | 'archived' | 'permissions') => void;
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
  onUpdateBoardSettings: (data: Partial<Board>) => void;
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
  onToggleMemberRole: (member: BoardMember, role: 'admin' | 'developer' | 'viewer') => void;
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
  onUpdateBoardSettings,
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined' || typeof window === 'undefined') return;

    lastActiveElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const raf = window.requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(dialogRef.current);
      (firstFocusable || dialogRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(dialogRef.current);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.cancelAnimationFrame(raf);
      lastActiveElementRef.current?.focus();
      lastActiveElementRef.current = null;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sidebarNode = (
    <div className="menu-sidebar-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="menu-sidebar"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="menu-header">
          {activeTab !== 'main' && (
            <button type="button" className="btn-icon" onClick={() => onTabChange('main')} aria-label={t('community.back')}>
              ←
            </button>
          )}
          <h3 id={titleId}>{t('board.menu')}</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        <div className="menu-content">
          {activeTab === 'main' && (
            <div className="menu-main-layout">
              <section className="menu-group">
                <h4 className="menu-group-title">{t('board.menu')}</h4>
                <ul className="menu-list" role="menu" aria-label={t('board.menu')}>
                  {canEditBoard && (
                    <li>
                      <button type="button" className="menu-list-item" onClick={() => onTabChange('background')} role="menuitem">
                        <span className="menu-item-icon">🖼️</span>
                        <span>{t('board.menu.changeBackground')}</span>
                        <span className="menu-list-item-chevron">›</span>
                      </button>
                    </li>
                  )}
                  <li>
                    <button type="button" className="menu-list-item" onClick={() => onTabChange('members')} role="menuitem">
                      <span className="menu-item-icon">👥</span>
                      <span>{t('board.menu.members')}</span>
                      <span className="menu-list-item-chevron">›</span>
                    </button>
                  </li>
                  {canEditBoard && (
                    <li>
                      <button type="button" className="menu-list-item" onClick={() => onTabChange('permissions')} role="menuitem">
                        <span className="menu-item-icon">🛡️</span>
                        <span>{t('permissions.title')}</span>
                        <span className="menu-list-item-chevron">›</span>
                      </button>
                    </li>
                  )}
                  {canEditBoard && (
                    <li>
                      <button type="button" className="menu-list-item" onClick={() => onTabChange('archived')} role="menuitem">
                        <span className="menu-item-icon">🗄️</span>
                        <span>{t('board.menu.archived')}</span>
                        <span className="menu-list-item-chevron">›</span>
                      </button>
                    </li>
                  )}
                </ul>
              </section>

              <section className="menu-group">
                <h4 className="menu-group-title">{t('board.menu.inviteTitle')}</h4>
                <div className="menu-invite">
                  <div className="menu-invite-row">
                    <input className="form-input" readOnly value={inviteLink} aria-label={t('board.menu.inviteTitle')} />
                    <button
                      type="button"
                      className="btn-primary menu-invite-btn"
                      onClick={onInvite}
                      disabled={!inviteLink || !canManageMembers}
                    >
                      {t('board.menu.inviteTitle')}
                    </button>
                  </div>
                  {!canManageMembers && (
                    <div className="menu-invite-note">
                      {t('members.permissionsHint')}
                    </div>
                  )}
                </div>
              </section>

              {(canEditBoard || canLeaveBoard) && (
                <section className="menu-group">
                  <ul className="menu-list">
                    {canEditBoard && (
                      <li>
                        <button type="button" className="menu-list-item" onClick={onArchiveToggle}>
                          <span className="menu-item-icon">📦</span>
                          <span>{board.is_archived ? t('board.unarchive') : t('board.archive')}</span>
                        </button>
                      </li>
                    )}
                    {isOwner ? (
                      <li>
                        <button type="button" className="menu-list-item menu-list-item-danger" onClick={onDeleteBoard}>
                          <span className="menu-item-icon">🗑️</span>
                          <span>{t('board.delete')}</span>
                        </button>
                      </li>
                    ) : canLeaveBoard ? (
                      <li>
                        <button type="button" className="menu-list-item menu-list-item-danger" onClick={onLeaveBoard}>
                          <span className="menu-item-icon">🚪</span>
                          <span>{t('board.leave')}</span>
                        </button>
                      </li>
                    ) : null}
                  </ul>
                </section>
              )}

              <section className="menu-group menu-nav">
                <h4 className="menu-group-title">{t('nav.menu')}</h4>
                <div className="menu-list menu-nav-list">
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
                </div>
              </section>

              <section className="menu-group menu-sidebar-footer">
                <div className="menu-language">
                  <span className="menu-group-title">{t('nav.language')}</span>
                  <LanguageSelect compact />
                </div>
                <button
                  type="button"
                  className="menu-logout-btn"
                  onClick={() => { onLogout(); onClose(); }}
                >
                  {t('nav.logout')}
                </button>
              </section>
            </div>
          )}
          {activeTab === 'permissions' && (
            <div className="members-panel">
              <h4 className="menu-section-title">{t('permissions.title')}</h4>
              <div className="permission-row">
                <label className="permission-label">
                  <span>{t('permissions.devCreateCards')}</span>
                  <input
                    type="checkbox"
                    checked={!!board.dev_can_create_cards}
                    onChange={(e) => onUpdateBoardSettings({ dev_can_create_cards: e.target.checked })}
                  />
                </label>
              </div>
              <div className="permission-row">
                <label className="permission-label">
                  <span>{t('permissions.devEditAssigned')}</span>
                  <input
                    type="checkbox"
                    checked={!!board.dev_can_edit_assigned_cards}
                    onChange={(e) => onUpdateBoardSettings({ dev_can_edit_assigned_cards: e.target.checked })}
                  />
                </label>
              </div>
              <div className="permission-row">
                <label className="permission-label">
                  <span>{t('permissions.devArchiveAssigned')}</span>
                  <input
                    type="checkbox"
                    checked={!!board.dev_can_archive_assigned_cards}
                    onChange={(e) => onUpdateBoardSettings({ dev_can_archive_assigned_cards: e.target.checked })}
                  />
                </label>
              </div>
              <div className="permission-row">
                <label className="permission-label">
                  <span>{t('permissions.devJoinCard')}</span>
                  <input
                    type="checkbox"
                    checked={!!board.dev_can_join_card}
                    onChange={(e) => onUpdateBoardSettings({ dev_can_join_card: e.target.checked })}
                  />
                </label>
              </div>
              <div className="permission-row">
                <label className="permission-label">
                  <span>{t('permissions.devCreateLists')}</span>
                  <input
                    type="checkbox"
                    checked={!!board.dev_can_create_lists}
                    onChange={(e) => onUpdateBoardSettings({ dev_can_create_lists: e.target.checked })}
                  />
                </label>
              </div>
            </div>
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

  if (typeof document !== 'undefined') {
    return createPortal(sidebarNode, document.body);
  }

  return sidebarNode;
};
