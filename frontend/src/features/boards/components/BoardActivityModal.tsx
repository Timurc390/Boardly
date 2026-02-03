import React from 'react';
import { useI18n } from '../../../context/I18nContext';
import { ActivityLog, Board } from '../../../types';

type BoardMember = NonNullable<Board['members']>[number];

interface BoardActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityMember: BoardMember | null;
  activityLogs: ActivityLog[];
  isLoading: boolean;
}

export const BoardActivityModal: React.FC<BoardActivityModalProps> = ({
  isOpen,
  onClose,
  activityMember,
  activityLogs,
  isLoading
}) => {
  const { t, locale } = useI18n();

  if (!isOpen || !activityMember) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content board-activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('members.activityTitle', { name: activityMember.user.username || activityMember.user.email })}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        {isLoading ? (
          <div className="loading-state">{t('common.loading')}</div>
        ) : activityLogs.length === 0 ? (
          <div className="empty-state">{t('members.activityEmpty')}</div>
        ) : (
          <div className="activity-list">
            {activityLogs.map(log => {
              const actionText = (log as any).action_text || log.action || '';
              const timestamp = (log as any).timestamp || (log as any).created_at;
              return (
                <div key={log.id} className="activity-item">
                  <div className="activity-icon">📝</div>
                  <div className="activity-details">
                    <span className="activity-text">{actionText}</span>
                    <span className="activity-date">
                      {timestamp ? new Date(timestamp).toLocaleString(locale) : t('activity.noDate')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
