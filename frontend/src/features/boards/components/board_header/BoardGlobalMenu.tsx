import React from 'react';
import { Link } from 'react-router-dom';
import { FiMenu } from 'shared/ui/fiIcons';
import { LanguageSelect } from '../../../../components/LanguageSelect';

interface BoardGlobalMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
  t: (key: string) => string;
}

export const BoardGlobalMenu: React.FC<BoardGlobalMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  onLogout,
  t,
}) => (
  <div className="board-global-menu">
    <button
      className="btn-icon board-global-menu-trigger"
      onClick={onToggle}
      aria-label={t('nav.menu')}
      aria-expanded={isOpen}
      aria-haspopup="menu"
    >
      <FiMenu aria-hidden="true" />
    </button>
    {isOpen && (
      <>
        <div className="board-global-menu-overlay" onClick={onClose} />
        <div className="board-global-menu-dropdown" role="menu" aria-label={t('nav.menu')}>
          <Link to="/boards" className="board-global-menu-item" role="menuitem" onClick={onClose}>
            {t('nav.board')}
          </Link>
          <Link to="/my-cards" className="board-global-menu-item" role="menuitem" onClick={onClose}>
            {t('nav.myCards')}
          </Link>
          <Link to="/help" className="board-global-menu-item" role="menuitem" onClick={onClose}>
            {t('nav.help')}
          </Link>
          <Link to="/community" className="board-global-menu-item" role="menuitem" onClick={onClose}>
            {t('nav.community')}
          </Link>
          <div className="board-global-menu-divider" />
          <div className="board-global-menu-lang">
            <LanguageSelect compact />
          </div>
          <Link to="/profile" className="board-global-menu-item" role="menuitem" onClick={onClose}>
            {t('nav.profile')}
          </Link>
          <button
            type="button"
            className="board-global-menu-item board-global-menu-button"
            role="menuitem"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            {t('nav.logout')}
          </button>
        </div>
      </>
    )}
  </div>
);
