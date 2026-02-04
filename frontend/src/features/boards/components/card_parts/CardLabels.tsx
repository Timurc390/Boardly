import React from 'react';
import { Card } from '../../../../types';
import { useI18n } from '../../../../context/I18nContext';

interface CardLabelsProps {
  card: Card;
  canEdit: boolean;
  startEditingDueDate: () => void;
  isOverdue: boolean;
  overdueText: string | null;
  onOpenLabelsPopover?: () => void;
}

export const CardLabels: React.FC<CardLabelsProps> = ({ 
  card, canEdit,
  startEditingDueDate, isOverdue, overdueText,
  onOpenLabelsPopover
}) => {
  const { t, locale } = useI18n();
  const assignedLabels = card.labels || [];

  const dueDate = card.due_date ? new Date(card.due_date) : null;
  const dueText = dueDate && !Number.isNaN(dueDate.getTime())
    ? dueDate.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
  const dueClass = [
    'card-due-badge',
    card.is_completed ? 'completed' : isOverdue ? 'overdue' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="card-labels-grid">
        <div className="card-section">
          <div className="card-section-header">
            <h4 className="card-main-section-title">{t('labels.title')}</h4>
            {canEdit && (
              <button type="button" className="card-section-add" onClick={onOpenLabelsPopover}>
                +
              </button>
            )}
          </div>
          <div
            className="card-labels-inline"
            onClick={canEdit ? onOpenLabelsPopover : undefined}
            data-interactive={canEdit ? 'true' : 'false'}
          >
            {assignedLabels.length === 0 && (
              <span className="card-muted">{t('labels.empty')}</span>
            )}
            {assignedLabels.map(label => (
              <span
                key={label.id}
                className="label-chip"
                style={{ background: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        </div>

        {card.due_date && (
            <div className="card-section">
                <div className="card-section-header">
                  <h4 className="card-main-section-title">{t('card.dueDate')}</h4>
                </div>
                <div
                    onClick={canEdit ? startEditingDueDate : undefined}
                    data-interactive={canEdit ? 'true' : 'false'}
                    className={dueClass}
                >
                    <span>{dueText}</span>
                    {overdueText && <span className="card-due-emphasis">{overdueText}</span>}
                    {card.is_completed && <span className="card-due-emphasis">{t('card.completedBadge')}</span>}
                </div>
            </div>
        )}
    </div>
  );
};
