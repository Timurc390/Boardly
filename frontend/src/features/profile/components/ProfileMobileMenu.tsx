import React from 'react';
import { Link } from 'react-router-dom';
import { FiX } from 'shared/ui/fiIcons';
import { type TabKey } from '../types';
import { ProfileTabNav } from './ProfileTabNav';

type ProfileMobileMenuItem = {
  key: TabKey;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

type ProfileMobileMenuProps = {
  isOpen: boolean;
  activeTab: TabKey;
  items: ProfileMobileMenuItem[];
  tabsLabel: string;
  closeLabel: string;
  backLabel: string;
  logoutLabel: string;
  onClose: () => void;
  onSelectTab: (key: TabKey) => void;
  onLogout: () => void;
};

export const ProfileMobileMenu: React.FC<ProfileMobileMenuProps> = ({
  isOpen,
  activeTab,
  items,
  tabsLabel,
  closeLabel,
  backLabel,
  logoutLabel,
  onClose,
  onSelectTab,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="profile-mobile-menu-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={tabsLabel}
    >
      <aside className="profile-mobile-menu" onClick={(event) => event.stopPropagation()}>
        <div className="profile-mobile-menu-top">
          <span>{tabsLabel}</span>
          <button
            type="button"
            className="profile-mobile-menu-close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <ProfileTabNav items={items} activeTab={activeTab} onSelect={onSelectTab} />

        <div className="profile-side-footer">
          <Link to="/boards" className="profile-return-link" onClick={onClose}>
            {backLabel}
          </Link>
          <button type="button" className="profile-logout-btn" onClick={onLogout}>
            {logoutLabel}
          </button>
        </div>
      </aside>
    </div>
  );
};
