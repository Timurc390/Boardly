import React from 'react';
import { useI18n } from '../../../context/I18nContext';
import { Board, Label } from '../../../types';

interface BoardFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterQuery: string;
  onSearchChange: (value: string) => void;
  filterMemberId: number | '';
  onMemberChange: (value: number | '') => void;
  filterLabelId: number | '';
  onLabelChange: (value: number | '') => void;
  filterDue: 'all' | 'overdue' | 'today' | 'week' | 'no_due';
  onDueChange: (value: 'all' | 'overdue' | 'today' | 'week' | 'no_due') => void;
  filterCompleted: 'all' | 'completed' | 'incomplete';
  onCompletedChange: (value: 'all' | 'completed' | 'incomplete') => void;
  members: NonNullable<Board['members']>;
  labels: Label[];
  onReset: () => void;
}

export const BoardFiltersModal: React.FC<BoardFiltersModalProps> = ({
  isOpen,
  onClose,
  filterQuery,
  onSearchChange,
  filterMemberId,
  onMemberChange,
  filterLabelId,
  onLabelChange,
  filterDue,
  onDueChange,
  filterCompleted,
  onCompletedChange,
  members,
  labels,
  onReset
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>{t('filters.title')}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('common.search')}</label>
          <input
            className="form-input"
            placeholder={t('toolbar.searchPlaceholder')}
            value={filterQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('filters.membersLabel')}</label>
          <select
            className="form-input"
            value={filterMemberId}
            onChange={(e) => onMemberChange(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">{t('filters.membersAll')}</option>
            {members.map(m => (
              <option key={m.user.id} value={m.user.id}>{m.user.username || m.user.email}</option>
            ))}
          </select>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('filters.labelsLabel')}</label>
          <select
            className="form-input"
            value={filterLabelId}
            onChange={(e) => onLabelChange(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">{t('filters.labelsAll')}</option>
            {labels.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('filters.dueLabel')}</label>
          <select
            className="form-input"
            value={filterDue}
            onChange={(e) => onDueChange(e.target.value as any)}
          >
            <option value="all">{t('filters.dueAny')}</option>
            <option value="overdue">{t('filters.dueOverdue')}</option>
            <option value="today">{t('filters.dueToday')}</option>
            <option value="week">{t('filters.dueWeek')}</option>
            <option value="no_due">{t('filters.dueNone')}</option>
          </select>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('filters.completedLabel')}</label>
          <select
            className="form-input"
            value={filterCompleted}
            onChange={(e) => onCompletedChange(e.target.value as any)}
          >
            <option value="all">{t('filters.completedAll')}</option>
            <option value="completed">{t('filters.completedOnly')}</option>
            <option value="incomplete">{t('filters.incompleteOnly')}</option>
          </select>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onReset}
          >
            {t('filters.reset')}
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            {t('filters.apply')}
          </button>
        </div>
      </div>
    </div>
  );
};
