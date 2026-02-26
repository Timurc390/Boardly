import React from 'react';
import { FiCalendar, FiPaperclip, FiTag, FiUsers } from 'shared/ui/fiIcons';

type CardQuickActionsProps = {
  isLabelsOpen: boolean;
  isDueDateOpen: boolean;
  activePopover: string | null;
  quickActionsDisabled: boolean;
  onOpenLabels: () => void;
  onOpenDueDate: () => void;
  onOpenAttachments: () => void;
  onOpenMembers: () => void;
  t: (key: string) => string;
};

export const CardQuickActions: React.FC<CardQuickActionsProps> = ({
  isLabelsOpen,
  isDueDateOpen,
  activePopover,
  quickActionsDisabled,
  onOpenLabels,
  onOpenDueDate,
  onOpenAttachments,
  onOpenMembers,
  t,
}) => (
  <div className="card-quick-actions">
    <button
      type="button"
      className={`card-quick-btn ${isLabelsOpen ? 'active' : ''}`}
      onClick={onOpenLabels}
      disabled={quickActionsDisabled}
    >
      <span className="card-quick-icon"><FiTag aria-hidden="true" /></span>
      {t('card.add.labels')}
    </button>
    <button type="button" className={`card-quick-btn ${isDueDateOpen ? 'active' : ''}`} onClick={onOpenDueDate} disabled={quickActionsDisabled}>
      <span className="card-quick-icon"><FiCalendar aria-hidden="true" /></span>
      {t('card.quick.dates')}
    </button>
    <button
      type="button"
      className={`card-quick-btn ${activePopover === 'attachments' ? 'active' : ''}`}
      onClick={onOpenAttachments}
    >
      <span className="card-quick-icon"><FiPaperclip aria-hidden="true" /></span>
      {t('card.add.attachments')}
    </button>
    <button
      type="button"
      className="card-quick-btn"
      onClick={onOpenMembers}
      disabled={quickActionsDisabled}
    >
      <span className="card-quick-icon"><FiUsers aria-hidden="true" /></span>
      {t('card.quick.members')}
    </button>
  </div>
);
