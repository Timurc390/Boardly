import React from 'react';
import { Link } from 'react-router-dom';
import { FiArchive, FiChevronRight, FiImage, FiLogOut, FiShield, FiTrash2, FiUsers } from 'shared/ui/fiIcons';
import { LanguageSelect } from '../../../../components/LanguageSelect';
import { type MainSectionProps } from './types';

export const MainSection: React.FC<MainSectionProps> = ({
  t,
  board,
  canEditBoard,
  canManageMembers,
  canLeaveBoard,
  isOwner,
  inviteLink,
  onInvite,
  onArchiveToggle,
  onDeleteBoard,
  onLeaveBoard,
  onLogout,
  onClose,
  onTabChange,
}) => {
  return (
    <div className="menu-main-layout">
      <section className="menu-group">
        <h4 className="menu-group-title">{t('board.menu')}</h4>
        <ul className="menu-list" role="menu" aria-label={t('board.menu')}>
          {canEditBoard && (
            <li>
              <button type="button" className="menu-list-item" onClick={() => onTabChange('background')} role="menuitem">
                <span className="menu-item-icon"><FiImage aria-hidden="true" /></span>
                <span>{t('board.menu.changeBackground')}</span>
                <span className="menu-list-item-chevron"><FiChevronRight aria-hidden="true" /></span>
              </button>
            </li>
          )}
          <li>
              <button type="button" className="menu-list-item" onClick={() => onTabChange('members')} role="menuitem">
              <span className="menu-item-icon"><FiUsers aria-hidden="true" /></span>
              <span>{t('board.menu.members')}</span>
              <span className="menu-list-item-chevron"><FiChevronRight aria-hidden="true" /></span>
            </button>
          </li>
          {canEditBoard && (
            <li>
              <button type="button" className="menu-list-item" onClick={() => onTabChange('permissions')} role="menuitem">
                <span className="menu-item-icon"><FiShield aria-hidden="true" /></span>
                <span>{t('permissions.title')}</span>
                <span className="menu-list-item-chevron"><FiChevronRight aria-hidden="true" /></span>
              </button>
            </li>
          )}
          {canEditBoard && (
            <li>
              <button type="button" className="menu-list-item" onClick={() => onTabChange('archived')} role="menuitem">
                <span className="menu-item-icon"><FiArchive aria-hidden="true" /></span>
                <span>{t('board.menu.archived')}</span>
                <span className="menu-list-item-chevron"><FiChevronRight aria-hidden="true" /></span>
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
            <div className="menu-invite-note">{t('members.permissionsHint')}</div>
          )}
        </div>
      </section>

      {(canEditBoard || canLeaveBoard) && (
        <section className="menu-group">
          <ul className="menu-list">
            {canEditBoard && (
              <li>
                <button type="button" className="menu-list-item" onClick={onArchiveToggle}>
                  <span className="menu-item-icon"><FiArchive aria-hidden="true" /></span>
                  <span>{board.is_archived ? t('board.unarchive') : t('board.archive')}</span>
                </button>
              </li>
            )}
            {isOwner ? (
              <li>
                <button type="button" className="menu-list-item menu-list-item-danger" onClick={onDeleteBoard}>
                  <span className="menu-item-icon"><FiTrash2 aria-hidden="true" /></span>
                  <span>{t('board.delete')}</span>
                </button>
              </li>
            ) : canLeaveBoard ? (
              <li>
                <button type="button" className="menu-list-item menu-list-item-danger" onClick={onLeaveBoard}>
                  <span className="menu-item-icon"><FiLogOut aria-hidden="true" /></span>
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
          <Link to="/boards" className="menu-list-item" onClick={onClose}>{t('nav.board')}</Link>
          <Link to="/my-cards" className="menu-list-item" onClick={onClose}>{t('nav.myCards')}</Link>
          <Link to="/help" className="menu-list-item" onClick={onClose}>{t('nav.help')}</Link>
          <Link to="/community" className="menu-list-item" onClick={onClose}>{t('nav.community')}</Link>
          <Link to="/profile" className="menu-list-item" onClick={onClose}>{t('nav.profile')}</Link>
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
          onClick={() => {
            onLogout();
            onClose();
          }}
        >
          {t('nav.logout')}
        </button>
      </section>
    </div>
  );
};
