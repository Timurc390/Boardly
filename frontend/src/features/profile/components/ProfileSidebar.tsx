import React from 'react';
import { Link } from 'react-router-dom';
import { type TabKey } from '../types';
import { ProfileTabNav } from './ProfileTabNav';

type ProfileSidebarItem = {
  key: TabKey;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

type ProfileSidebarProps = {
  activeTab: TabKey;
  items: ProfileSidebarItem[];
  onSelectTab: (key: TabKey) => void;
  onLogout: () => void;
  backLabel: string;
  logoutLabel: string;
};

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeTab,
  items,
  onSelectTab,
  onLogout,
  backLabel,
  logoutLabel,
}) => (
  <aside className="profile-side">
    <Link to="/boards" className="profile-side-brand">Boardly</Link>

    <ProfileTabNav items={items} activeTab={activeTab} onSelect={onSelectTab} />

    <div className="profile-side-footer">
      <Link to="/boards" className="profile-return-link">
        {backLabel}
      </Link>
      <button type="button" className="profile-logout-btn" onClick={onLogout}>
        {logoutLabel}
      </button>
    </div>
  </aside>
);
