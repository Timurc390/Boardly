import React from 'react';
import { FiCheck, FiExternalLink, FiTrash2, FiX } from 'shared/ui/fiIcons';
import { type Board, type Card, type User } from '../../../../types';
import { resolveMediaUrl } from '../../../../utils/mediaUrl';
import { confirmAction } from '../../../../shared/utils/confirm';
import { type CardPopover } from '../../hooks/useCardModalState';

type CardModalPopoversProps = {
  card: Card;
  board: Board;
  activePopover: CardPopover;
  isDueDateOpen: boolean;
  isCoverMenuOpen: boolean;
  isColorblindMode: boolean;
  canEditCard: boolean;
  canManageMembers: boolean;
  isUploadingAttachment: boolean;
  dueDateDate: string;
  dueDateTime: string;
  labelQuery: string;
  memberQuery: string;
  labelIds: Set<number>;
  filteredLabels: Array<{ id: number; name: string; color: string }>;
  filteredMembers: User[];
  assignedMemberIds: Set<number>;
  newLabelName: string;
  newLabelColor: string;
  coverColorOptions: string[];
  labelColorOptions: string[];
  resolveCoverColor: (color?: string | null, isColorblind?: boolean) => string;
  resolveAttachmentUrl: (value?: string) => string;
  onSetActivePopover: React.Dispatch<React.SetStateAction<CardPopover>>;
  onSetDueDateDate: (value: string) => void;
  onSetDueDateTime: (value: string) => void;
  onSetCoverMenuOpen: (value: boolean) => void;
  onToggleColorblindMode: () => void;
  onSetLabelQuery: (value: string) => void;
  onSetMemberQuery: (value: string) => void;
  onSetNewLabelName: (value: string) => void;
  onSetNewLabelColor: (value: string) => void;
  onToggleLabel: (labelId: number) => void;
  onDeleteLabel: (labelId: number) => void;
  onCreateLabel: () => void;
  onUpdateCardColor: (color: string) => void;
  onHandleCoverModeChange: (mode: 'full' | 'header') => void;
  coverMode: string;
  checklistCopyFromId: number | null;
  onSetChecklistCopyFromId: (value: number | null) => void;
  newChecklistTitle: string;
  onSetNewChecklistTitle: (value: string) => void;
  onCreateChecklist: () => void;
  isCreatingChecklist: boolean;
  onSaveDueDate: () => void;
  onRemoveDueDate: () => void;
  onAttachmentUpload: (file?: File) => void;
  onDeleteAttachment: (attachmentId: number) => void;
  onRemoveMember: (userId: number) => void;
  onAddMember: (userId: number) => void;
  t: (key: string) => string;
};

export const CardModalPopovers: React.FC<CardModalPopoversProps> = ({
  card,
  board,
  activePopover,
  isDueDateOpen,
  isCoverMenuOpen,
  isColorblindMode,
  canEditCard,
  canManageMembers,
  isUploadingAttachment,
  dueDateDate,
  dueDateTime,
  labelQuery,
  memberQuery,
  labelIds,
  filteredLabels,
  filteredMembers,
  assignedMemberIds,
  newLabelName,
  newLabelColor,
  coverColorOptions,
  labelColorOptions,
  resolveCoverColor,
  resolveAttachmentUrl,
  onSetActivePopover,
  onSetDueDateDate,
  onSetDueDateTime,
  onSetCoverMenuOpen,
  onToggleColorblindMode,
  onSetLabelQuery,
  onSetMemberQuery,
  onSetNewLabelName,
  onSetNewLabelColor,
  onToggleLabel,
  onDeleteLabel,
  onCreateLabel,
  onUpdateCardColor,
  onHandleCoverModeChange,
  coverMode,
  checklistCopyFromId,
  onSetChecklistCopyFromId,
  newChecklistTitle,
  onSetNewChecklistTitle,
  onCreateChecklist,
  isCreatingChecklist,
  onSaveDueDate,
  onRemoveDueDate,
  onAttachmentUpload,
  onDeleteAttachment,
  onRemoveMember,
  onAddMember,
  t,
}) => (
  <>
    {isCoverMenuOpen && (
      <div className="card-cover-menu card-cover-floating">
        <div className="card-cover-menu-header">
          <span className="card-popover-title">{t('card.cover.title')}</span>
          <button
            type="button"
            className="btn-icon card-popover-close"
            onClick={() => onSetCoverMenuOpen(false)}
            aria-label={t('common.close')}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        <div className="card-cover-section">
          <div className="card-cover-section-title">{t('card.cover.size')}</div>
          <div className="card-cover-size-options">
            <button
              type="button"
              className={`card-cover-size ${coverMode === 'full' ? 'active' : ''}`}
              onClick={() => onHandleCoverModeChange('full')}
            >
              <span className="card-cover-preview full" style={{ background: resolveCoverColor(card.card_color || '#6d6d6d', isColorblindMode) }} />
              <span className="card-cover-size-label">{t('card.cover.size.full')}</span>
            </button>
            <button
              type="button"
              className={`card-cover-size ${coverMode === 'header' ? 'active' : ''}`}
              onClick={() => onHandleCoverModeChange('header')}
            >
              <span className="card-cover-preview header" style={{ background: resolveCoverColor(card.card_color || '#6d6d6d', isColorblindMode) }} />
              <span className="card-cover-size-label">{t('card.cover.size.header')}</span>
            </button>
          </div>
        </div>
        <div className="card-cover-section">
          <div className="card-cover-section-title">{t('card.cover.colors')}</div>
          <div className="card-cover-swatches card-cover-swatches-wide">
            {coverColorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className={`card-cover-swatch ${card.card_color === color ? 'active' : ''}`}
                style={{ background: resolveCoverColor(color, isColorblindMode) }}
                onClick={() => onUpdateCardColor(color)}
                aria-label={color}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className={`card-cover-accessibility ${isColorblindMode ? 'active' : ''}`}
          onClick={onToggleColorblindMode}
        >
          {isColorblindMode ? t('card.cover.colorblind.disable') : t('card.cover.colorblind.enable')}
        </button>
      </div>
    )}

    {activePopover === 'labels' && (
      <div className="card-detail-popover">
        <div className="card-popover-header">
          <div className="card-popover-title">{t('card.add.labels')}</div>
          <button
            type="button"
            className="btn-icon card-popover-close"
            onClick={() => onSetActivePopover(null)}
            aria-label={t('common.close')}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        <input
          className="form-input card-popover-search"
          placeholder={`${t('common.search')}...`}
          value={labelQuery}
          onChange={(e) => onSetLabelQuery(e.target.value)}
        />
        <div className="card-popover-list">
          {filteredLabels.length === 0 && (
            <div className="empty-state">{t('labels.empty')}</div>
          )}
          {filteredLabels.map((label) => (
            <div key={label.id} className="card-popover-row">
              <button
                type="button"
                className={`card-popover-item ${labelIds.has(label.id) ? 'active' : ''}`}
                onClick={() => onToggleLabel(label.id)}
              >
                <span className="card-popover-check">{labelIds.has(label.id) ? <FiCheck aria-hidden="true" /> : ''}</span>
                <span className="label-chip" style={{ background: label.color }}>{label.name}</span>
              </button>
              {canEditCard && (
                <button
                  type="button"
                  className="btn-icon card-popover-delete"
                  title={t('common.delete')}
                  aria-label={t('common.delete')}
                  onClick={() => {
                    if (confirmAction(t('labels.deleteConfirm'))) {
                      onDeleteLabel(label.id);
                    }
                  }}
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="card-popover-footer">
          <div className="card-label-color-grid">
            {labelColorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className={`card-label-color-btn ${newLabelColor === color ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => onSetNewLabelColor(color)}
                aria-label={color}
              />
            ))}
          </div>
          <input
            className="form-input"
            placeholder={t('labels.newPlaceholder')}
            value={newLabelName}
            onChange={(e) => onSetNewLabelName(e.target.value)}
          />
          <button type="button" className="btn-secondary btn-sm" onClick={onCreateLabel}>
            {t('labels.add')}
          </button>
        </div>
      </div>
    )}

    {activePopover === 'checklist' && (
      <div className="card-detail-popover checklist-create-popover">
        <div className="checklist-create-header">
          <div className="card-popover-title">{t('checklist.createPopoverTitle')}</div>
          <button
            type="button"
            className="btn-icon checklist-create-close"
            onClick={() => onSetActivePopover(null)}
            aria-label={t('common.close')}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <label className="checklist-create-field">
          <span className="checklist-create-label">{t('checklist.nameLabel')}</span>
          <input
            className="form-input"
            value={newChecklistTitle}
            onChange={(e) => onSetNewChecklistTitle(e.target.value)}
            placeholder={t('checklist.nameLabel')}
            autoFocus
          />
        </label>

        <label className="checklist-create-field">
          <span className="checklist-create-label">{t('checklist.copy.fromLabel')}</span>
          <select
            className="form-input"
            value={checklistCopyFromId ?? ''}
            onChange={(e) => {
              const next = e.target.value ? Number(e.target.value) : null;
              onSetChecklistCopyFromId(Number.isNaN(next) ? null : next);
            }}
          >
            <option value="">{t('checklist.copy.none')}</option>
            {(card.checklists || []).map((checklist) => (
              <option key={checklist.id} value={checklist.id}>
                {checklist.title || `${t('checklist.title')} #${checklist.id}`}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={onCreateChecklist}
          disabled={isCreatingChecklist}
        >
          {isCreatingChecklist ? `${t('common.loading')}...` : t('common.add')}
        </button>
      </div>
    )}

    {isDueDateOpen && (
      <div className="card-detail-popover card-due-date-popover">
        <div className="card-popover-header">
          <div className="card-popover-title">{t('card.dueDate')}</div>
          <button
            type="button"
            className="btn-icon card-popover-close"
            onClick={() => onSetActivePopover(null)}
            aria-label={t('common.close')}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        <label className="checklist-create-field">
          <span className="checklist-create-label">{t('card.dueDate')}</span>
          <input
            type="date"
            className="form-input"
            value={dueDateDate}
            onChange={(e) => onSetDueDateDate(e.target.value)}
          />
        </label>
        <label className="checklist-create-field">
          <span className="checklist-create-label">{t('card.quick.dates')}</span>
          <input
            type="time"
            className="form-input"
            value={dueDateTime}
            onChange={(e) => onSetDueDateTime(e.target.value)}
          />
        </label>
        <div className="card-due-date-actions">
          <button type="button" className="btn-primary btn-sm" onClick={onSaveDueDate}>
            {t('common.save')}
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => onSetActivePopover(null)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={onRemoveDueDate}>
            {t('card.dueDateRemove')}
          </button>
        </div>
      </div>
    )}

    {activePopover === 'members' && (
      <div className="card-detail-popover card-members-popover">
        <div className="card-popover-header">
          <div className="card-popover-title">{t('members.addListTitle')}</div>
          <button
            type="button"
            className="btn-icon card-popover-close"
            onClick={() => onSetActivePopover(null)}
            aria-label={t('common.close')}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        <input
          className="form-input card-popover-search card-members-popover-search"
          placeholder={t('members.searchParticipants')}
          value={memberQuery}
          onChange={(e) => onSetMemberQuery(e.target.value)}
        />
        <div className="card-members-popover-section-title">{t('card.quick.members')}</div>
        <div className="card-popover-list card-members-popover-list">
          {filteredMembers.map((member) => {
            const label = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username || member.email;
            const initial = (label?.[0] || '?').toUpperCase();
            const rawAvatar = member.profile?.avatar_url || member.profile?.avatar || '';
            const avatarSrc = resolveMediaUrl(rawAvatar);
            const isAssigned = assignedMemberIds.has(member.id);
            const membership = board.members?.find((item) => item.user.id === member.id);
            const isViewer = membership?.role === 'viewer';
            const actionDisabled = !isAssigned && isViewer;
            return (
              <div
                key={member.id}
                className={`card-popover-item card-members-popover-item ${isAssigned ? 'active' : ''}`}
              >
                <span className="card-popover-avatar card-members-popover-avatar">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={label}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=525867&color=ffffff&size=64`;
                      }}
                    />
                  ) : (
                    initial
                  )}
                </span>
                <div className="card-popover-member">
                  <div className="card-popover-member-name">{label}</div>
                  <div className={`card-popover-member-status ${isAssigned ? 'assigned' : 'unassigned'}`}>
                    {isAssigned ? t('common.assigned') : t('common.notAssigned')}
                  </div>
                </div>
                <button
                  type="button"
                  className={`card-member-action-btn ${isAssigned ? 'remove' : 'add'}`}
                  onClick={() => {
                    if (!canManageMembers) return;
                    if (actionDisabled) return;
                    if (isAssigned) {
                      onRemoveMember(member.id);
                      return;
                    }
                    onAddMember(member.id);
                  }}
                  disabled={actionDisabled}
                  title={actionDisabled ? t('members.viewerCannotBeAssigned') : undefined}
                >
                  {isAssigned ? t('common.delete') : t('common.add')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {activePopover === 'attachments' && (
      <div className="card-detail-popover">
        <div className="card-popover-header">
          <div className="card-popover-title">{t('attachments.title')}</div>
          <button
            type="button"
            className="btn-icon card-popover-close"
            onClick={() => onSetActivePopover(null)}
            aria-label={t('common.close')}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        <label className="card-attachment-upload">
          <input
            type="file"
            onChange={(e) => onAttachmentUpload(e.target.files?.[0])}
            disabled={!canEditCard || isUploadingAttachment}
          />
          <span>{t('attachments.add')}</span>
        </label>
        <div className="card-popover-list">
          {(card.attachments || []).length === 0 && (
            <div className="empty-state">{t('attachments.empty')}</div>
          )}
          {(card.attachments || []).map((att) => {
            const fileName = att.file?.split('/').pop() || att.name || t('attachments.title');
            const fileUrl = resolveAttachmentUrl(att.file);
            return (
              <div key={att.id} className="card-attachment-row">
                <a
                  className="card-attachment-name card-attachment-link"
                  href={fileUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!fileUrl) e.preventDefault();
                  }}
                  title={fileName}
                >
                  {fileName}
                </a>
                <div className="card-attachment-actions">
                  <a
                    className="btn-secondary btn-sm card-attachment-open"
                    href={fileUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!fileUrl) e.preventDefault();
                    }}
                    aria-label={fileName}
                    title={fileName}
                  >
                    <FiExternalLink aria-hidden="true" />
                  </a>
                  {canEditCard && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => onDeleteAttachment(att.id)}
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </>
);
