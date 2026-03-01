import React from 'react';
import { type Card } from '../../../../types';
import { useI18n } from '../../../../context/I18nContext';

interface CardScheduleSettingsProps {
  card: Card;
  canEdit: boolean;
  onUpdateCard: (data: Partial<Card>) => void;
}

const REMINDER_OPTIONS = [15, 60, 180, 1440];

export const CardScheduleSettings: React.FC<CardScheduleSettingsProps> = ({ card, canEdit, onUpdateCard }) => {
  const { t } = useI18n();

  return (
    <div className="card-section">
      <div className="card-section-header">
        <h4 className="card-main-section-title">{t('card.schedule.title')}</h4>
      </div>

      <div className="card-schedule-grid">
        <label className="card-schedule-field">
          <span>{t('card.recurrence.label')}</span>
          <select
            className="form-input"
            value={card.recurrence || 'none'}
            onChange={(e) => onUpdateCard({ recurrence: e.target.value as Card['recurrence'] })}
            disabled={!canEdit}
          >
            <option value="none">{t('card.recurrence.none')}</option>
            <option value="daily">{t('card.recurrence.daily')}</option>
            <option value="weekly">{t('card.recurrence.weekly')}</option>
            <option value="monthly">{t('card.recurrence.monthly')}</option>
          </select>
        </label>

        <label className="card-schedule-field">
          <span>{t('card.reminder.label')}</span>
          <select
            className="form-input"
            value={card.reminder_minutes_before ?? ''}
            onChange={(e) =>
              onUpdateCard({
                reminder_minutes_before: e.target.value ? Number(e.target.value) : null,
              })
            }
            disabled={!canEdit}
          >
            <option value="">{t('card.reminder.none')}</option>
            {REMINDER_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes >= 60 ? `${Math.round(minutes / 60)}h` : `${minutes}m`}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};
