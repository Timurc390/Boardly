import React from 'react';
import { type Locale } from '../../../i18n/translations';
import { type ActivityLog } from '../../../types';
import { type TranslateFn } from '../types';

type ActivityTabProps = {
  loadingActivity: boolean;
  activityLogs: ActivityLog[];
  locale: Locale;
  onClearActivity: () => Promise<void>;
  getActivityMessage: (log: ActivityLog) => string;
  t: TranslateFn;
};

export const ActivityTab: React.FC<ActivityTabProps> = ({
  loadingActivity,
  activityLogs,
  locale,
  onClearActivity,
  getActivityMessage,
  t,
}) => {
  return (
    <div className="profile-activity-shell">
      <div className="profile-card-actions" style={{ marginBottom: 12 }}>
        <button
          className="profile-btn-secondary"
          type="button"
          onClick={onClearActivity}
          disabled={loadingActivity || activityLogs.length === 0}
        >
          Clear activity
        </button>
      </div>
      <div className="activity-list">
        {loadingActivity ? (
          <div className="activity-empty-row">{t('common.loading')}</div>
        ) : activityLogs.length === 0 ? (
          <div className="activity-empty-row">{t('profile.activity.empty')}</div>
        ) : (
          activityLogs.map((log) => (
            <div key={log.id} className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-details">
                <span className="activity-text">{getActivityMessage(log)}</span>
                <span className="activity-date">
                  {new Date(log.created_at).toLocaleString(locale)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
