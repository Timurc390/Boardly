import React, { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiX } from 'shared/ui/fiIcons';
import { LIST_COLOR_OPTIONS } from './listColor';

type BoardColumnMenuProps = {
  canAddCards: boolean;
  canEditList: boolean;
  isTouchViewport: boolean;
  listColor: string;
  normalizedListColor: string;
  onClose: () => void;
  onMenuAction: (action: 'add' | 'rename' | 'copy' | 'archive' | 'archiveAllCards' | 'move' | 'moveAll' | 'remove') => void;
  onPickColor: (color: string) => void;
  onClearColor: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  dropdownStyle?: React.CSSProperties;
  t: (key: string) => string;
};

export const BoardColumnMenu: React.FC<BoardColumnMenuProps> = ({
  canAddCards,
  canEditList,
  isTouchViewport,
  listColor,
  normalizedListColor,
  onClose,
  onMenuAction,
  onPickColor,
  onClearColor,
  dropdownRef,
  dropdownStyle,
  t,
}) => {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(true);

  return (
    <div
      ref={dropdownRef}
      className={`list-menu-dropdown ${isTouchViewport ? 'is-touch-portal' : ''}`.trim()}
      role="menu"
      aria-label={t('list.menu')}
      style={dropdownStyle}
    >
      <div className="list-menu-header">
        <span>{t('list.menu')}</span>
        <button type="button" className="list-menu-close" onClick={onClose} aria-label={t('common.close')}>
          <FiX aria-hidden="true" />
        </button>
      </div>
      <div className="list-menu-section">
        {canAddCards && (
          <button className="list-menu-item" role="menuitem" onClick={() => onMenuAction('add')}>
            {t('list.menu.addCard')}
          </button>
        )}
        {canEditList && (
          <button className="list-menu-item" role="menuitem" onClick={() => onMenuAction('rename')}>
            {t('common.edit')}
          </button>
        )}
        <button className="list-menu-item" role="menuitem" onClick={() => onMenuAction('copy')}>
          {t('list.copy')}
        </button>
        <button className="list-menu-item" role="menuitem" onClick={() => onMenuAction('move')}>
          {t('list.menu.move')}
        </button>
        <button className="list-menu-item" role="menuitem" onClick={() => onMenuAction('moveAll')}>
          {t('list.menu.moveAll')}
        </button>
      </div>
      <div className="list-color-section">
        <button type="button" className="list-color-header" onClick={() => setIsColorPickerOpen((prev) => !prev)}>
          <span className="list-color-title">{t('list.color.title')}</span>
          <span className="list-color-chevron">{isColorPickerOpen ? <FiChevronDown aria-hidden="true" /> : <FiChevronRight aria-hidden="true" />}</span>
        </button>
        {isColorPickerOpen && (
          <>
            <div className="list-color-grid">
              {LIST_COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`list-color-swatch ${normalizedListColor === color.toLowerCase() ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => onPickColor(color)}
                  aria-pressed={normalizedListColor === color.toLowerCase()}
                  aria-label={color}
                  title={color}
                />
              ))}
            </div>
            <button
              type="button"
              className={`list-color-none ${!listColor ? 'active' : ''}`}
              onClick={onClearColor}
            >
              {t('list.color.none')}
            </button>
          </>
        )}
      </div>
      <div className="list-menu-divider" />
      <div className="list-menu-section">
        <button className="list-menu-item" role="menuitem" onClick={() => onMenuAction('archive')}>
          {t('list.archive')}
        </button>
        <button className="list-menu-item" role="menuitem" onClick={() => onMenuAction('archiveAllCards')}>
          {t('list.menu.archiveAllCards')}
        </button>
        <button className="list-menu-item danger" role="menuitem" onClick={() => onMenuAction('remove')}>
          {t('common.delete')}
        </button>
      </div>
    </div>
  );
};
