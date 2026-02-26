import React from 'react';
import { type TabKey } from '../types';

type ProfileTabNavItem = {
  key: TabKey;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

type ProfileTabNavProps = {
  items: ProfileTabNavItem[];
  activeTab: TabKey;
  onSelect: (key: TabKey) => void;
};

export const ProfileTabNav: React.FC<ProfileTabNavProps> = ({ items, activeTab, onSelect }) => (
  <nav className="profile-nav">
    {items.map(({ key, label, Icon }) => (
      <button
        key={key}
        type="button"
        onClick={() => onSelect(key)}
        className={`profile-nav-item ${activeTab === key ? 'active' : ''}`}
      >
        <span className="profile-nav-icon" aria-hidden="true">
          <Icon />
        </span>
        {label}
      </button>
    ))}
  </nav>
);
