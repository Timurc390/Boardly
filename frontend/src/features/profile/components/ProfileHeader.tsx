import React from 'react';
import { Link } from 'react-router-dom';
import { FiMoreHorizontal } from 'shared/ui/fiIcons';

interface ProfileHeaderProps {
  backIcon: React.ReactNode;
  title: string;
  subtitle: string;
  backLabel: string;
  tabsLabel: string;
  isMobileMenuOpen: boolean;
  onOpenMobileMenu: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  backIcon,
  title,
  subtitle,
  backLabel,
  tabsLabel,
  isMobileMenuOpen,
  onOpenMobileMenu,
}) => (
  <div className="profile-header">
    <div className="profile-header-controls">
      <Link to="/boards" className="profile-top-back">
        {backIcon}
        <span>{backLabel}</span>
      </Link>
      <button
        type="button"
        className="profile-mobile-menu-trigger"
        aria-label={tabsLabel}
        aria-expanded={isMobileMenuOpen}
        onClick={onOpenMobileMenu}
      >
        <FiMoreHorizontal aria-hidden="true" />
      </button>
    </div>
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
  </div>
);
