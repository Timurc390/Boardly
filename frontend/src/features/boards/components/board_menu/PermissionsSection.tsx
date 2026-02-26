import React from 'react';
import { type PermissionsSectionProps } from './types';

export const PermissionsSection: React.FC<PermissionsSectionProps> = ({ t, board, onUpdateBoardSettings }) => {
  return (
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
  );
};
