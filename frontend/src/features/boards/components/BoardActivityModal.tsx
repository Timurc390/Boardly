import React from 'react';
import { useI18n } from '../../../context/I18nContext';
import { ActivityLog, Board } from '../../../types';
import { Modal } from '../../../components/ui/Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('members.activityTitle', { name: activityMember.user.username || activityMember.user.email })}
      contentClassName="board-activity-modal"
    >
      {isLoading ? (
        <div className="loading-state">{t('common.loading')}</div>
      ) : activityLogs.length === 0 ? (
        <div className="empty-state">{t('members.activityEmpty')}</div>
      ) : (
        <div className="activity-list">
          {activityLogs.map(log => {
            const actionText = (log as ActivityLog & { action_text?: string }).action_text || log.action || '';
            const timestamp = (log as ActivityLog & { timestamp?: string }).timestamp || log.created_at;
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
    </Modal>
  );
};
