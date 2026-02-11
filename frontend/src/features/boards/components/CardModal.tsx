import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Board, User } from '../../../types';
import { CardHeader } from './card_parts/CardHeader';
import { CardLabels } from './card_parts/CardLabels';
import { CardDescription } from './card_parts/CardDescription';
import { CardChecklists } from './card_parts/CardChecklists';
import { CardComments } from './card_parts/CardComments';
import { CardSidebar } from './card_parts/CardSidebar';

import { useAppSelector } from '../../../store/hooks';
import { useI18n } from '../../../context/I18nContext';

interface CardModalProps {
  card: Card;
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onUpdateCard: (data: Partial<Card>) => void;
  onDeleteCard: () => void;
  onCopyCard: () => void;
  onMoveCard?: (cardId: number, sourceListId: number, destListId: number, destIndex: number) => void;
  onAddChecklist: (title: string) => Promise<{ id?: number } | null | void> | { id?: number } | null | void;
  onDeleteChecklist: (checklistId: number) => Promise<any> | void;
  onAddChecklistItem: (checklistId: number, text: string) => Promise<any> | void;
  onDeleteChecklistItem: (itemId: number, checklistId?: number) => Promise<any> | void;
  onToggleChecklistItem: (itemId: number, isChecked: boolean) => Promise<any> | void;
  onUpdateChecklistItem: (itemId: number, text: string) => Promise<any> | void;
  onAddComment: (text: string) => void;
  onUpdateComment: (commentId: number, text: string) => void;
  onDeleteComment: (commentId: number) => void;
  onUpdateLabels: (labelIds: number[]) => void;
  onCreateLabel: (name: string, color: string) => Promise<{ id?: number } | void> | void;
  onUpdateLabel: (id: number, name: string, color: string) => void;
  onDeleteLabel: (id: number) => void;
  onJoinCard: () => void;
  onLeaveCard: () => void;
  onRemoveMember: (userId: number) => void;
  onAddMember: (userId: number) => void;
  onAddAttachment: (file: File) => Promise<void> | void;
  onDeleteAttachment: (attachmentId: number) => void;
}

const formatDateForInput = (isoString?: string | null) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const CardModal: React.FC<CardModalProps> = ({ 
  card, board, isOpen, onClose, 
  onCopyLink, onUpdateCard, onDeleteCard, onCopyCard,
  onMoveCard,
  onAddChecklist, onDeleteChecklist, onAddChecklistItem, onDeleteChecklistItem, onToggleChecklistItem, onUpdateChecklistItem, onAddComment,
  onUpdateComment, onDeleteComment,
  onUpdateLabels, onCreateLabel, onUpdateLabel, onDeleteLabel,
  onJoinCard, onLeaveCard, onRemoveMember, onAddMember, onAddAttachment, onDeleteAttachment
}) => {
  const { user } = useAppSelector(state => state.auth);
  const { t } = useI18n();
  
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateDate, setDueDateDate] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [activePopover, setActivePopover] = useState<'labels' | 'members' | 'attachments' | 'checklist' | null>(null);
  const [labelQuery, setLabelQuery] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#61bd4f');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [checklistCopyFromId, setChecklistCopyFromId] = useState<number | null>(null);
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
  const labelsSectionRef = useRef<HTMLDivElement | null>(null);
  const checklistsSectionRef = useRef<HTMLDivElement | null>(null);
  const coverSectionRef = useRef<HTMLDivElement | null>(null);
  const labelColorOptions = [
    '#61bd4f',
    '#f2d600',
    '#ff9f1a',
    '#eb5a46',
    '#c377e0',
    '#0079bf',
    '#00c2e0',
    '#51e898',
    '#ff78cb',
    '#344563'
  ];

  const membership = board.members?.find(m => m.user.id === user?.id);
  const role = membership?.role;
  const isOwner = board.owner?.id === user?.id;
  const isAdmin = role === 'admin';
  const isDeveloper = role === 'developer';
  const isViewer = role === 'viewer';
  const isCardMember = card.members?.some(u => u.id === user?.id);
  const canEditCard = !!(isOwner || isAdmin || (isDeveloper && board.dev_can_edit_assigned_cards && isCardMember));
  const canArchiveCard = !!(isOwner || isAdmin || (isDeveloper && board.dev_can_archive_assigned_cards && isCardMember));
  const canDeleteCard = !!(isOwner || isAdmin);
  const canManageMembers = !!(isOwner || isAdmin);
  const canJoinCard = !!(canManageMembers || (isDeveloper && board.dev_can_join_card));
  const canLeaveCard = !!isCardMember;
  const canComment = !!(isOwner || isAdmin || isDeveloper || isViewer);
  const quickActionsDisabled = !canEditCard;
  const coverColor = card.card_color?.trim();
  const hasCover = !!coverColor;
  const coverMode = card.cover_size === 'full' ? 'full' : 'header';

  useEffect(() => {
    if (!isOpen) {
      setIsQuickAddOpen(false);
      setIsCoverMenuOpen(false);
      setActivePopover(null);
      return;
    }
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const startEditingDueDate = () => {
    setIsCoverMenuOpen(false);
    setIsQuickAddOpen(false);
    setActivePopover(null);
    const formatted = formatDateForInput(card.due_date);
    if (formatted) {
      const [datePart, timePart] = formatted.split('T');
      setDueDateDate(datePart || '');
      setDueDateTime(timePart || '');
    } else {
      setDueDateDate('');
      setDueDateTime('');
    }
    setIsEditingDueDate(true);
  };

  const saveDueDate = () => {
    if (!dueDateDate) {
      window.alert(t('card.dueDateRequired'));
      return;
    }
    const time = dueDateTime || '12:00';
    const date = new Date(`${dueDateDate}T${time}`);
    onUpdateCard({ due_date: date.toISOString(), is_completed: false });
    setIsEditingDueDate(false);
  };

  const removeDueDate = () => {
    onUpdateCard({ due_date: null, is_completed: false });
    setDueDateDate('');
    setDueDateTime('');
    setIsEditingDueDate(false);
  };

  const getOverdueText = (isoString?: string | null) => {
    if (!isoString) return null;
    const now = new Date();
    const due = new Date(isoString);
    if (now <= due) return null;

    const diffMs = now.getTime() - due.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return t('card.overdue.days', { count: String(diffDays) });
    if (diffHours > 0) return t('card.overdue.hours', { count: String(diffHours) });
    return t('card.overdue.minutes', { count: String(diffMins) });
  };

  const overdueText = !card.is_completed ? getOverdueText(card.due_date) : null;
  const isOverdue = !!overdueText;

  const handleCoverModeChange = (mode: 'full' | 'header') => {
    if (!card.card_color) {
      onUpdateCard({ cover_size: mode, card_color: '#ef6c00' });
      return;
    }
    onUpdateCard({ cover_size: mode });
  };

  const getNextChecklistTitle = () => {
    const base = t('checklist.title');
    const taken = new Set(
      (card.checklists || [])
        .map(checklist => (checklist.title || '').trim().toLowerCase())
        .filter(Boolean)
    );
    if (!taken.has(base.toLowerCase())) return base;
    let index = 2;
    let candidate = `${base} ${index}`;
    while (taken.has(candidate.toLowerCase())) {
      index += 1;
      candidate = `${base} ${index}`;
    }
    return candidate;
  };

  const openCoverMenu = () => {
    setIsEditingDueDate(false);
    setIsCoverMenuOpen(true);
    setIsQuickAddOpen(false);
    setActivePopover(null);
    window.setTimeout(() => coverSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
  };

  const openChecklistPopover = () => {
    setIsCoverMenuOpen(false);
    setIsQuickAddOpen(false);
    setActivePopover('checklist');
    setNewChecklistTitle(getNextChecklistTitle());
    setChecklistCopyFromId(null);
  };

  const closePopovers = () => {
    setIsQuickAddOpen(false);
    setIsCoverMenuOpen(false);
    setActivePopover(null);
  };

  const handleQuickAdd = () => {
    setIsQuickAddOpen(prev => !prev);
    setIsCoverMenuOpen(false);
    setActivePopover(null);
  };

  const handleQuickAddItem = (action: 'labels' | 'checklist' | 'members' | 'attachments') => {
    setIsCoverMenuOpen(false);
    switch (action) {
      case 'labels':
        setActivePopover('labels');
        break;
      case 'checklist':
        openChecklistPopover();
        break;
      case 'members':
        setActivePopover('members');
        break;
      case 'attachments':
        setActivePopover('attachments');
        break;
      default:
        break;
    }
    setIsQuickAddOpen(false);
  };

  const labelIds = useMemo(() => new Set((card.labels || []).map(l => l.id)), [card.labels]);
  const isLabelsOpen = activePopover === 'labels';
  const isMembersOpen = activePopover === 'members';
  const filteredLabels = useMemo(() => {
    if (!isLabelsOpen) return [];
    const q = labelQuery.trim().toLowerCase();
    if (!q) return board.labels || [];
    return (board.labels || []).filter(label => label.name.toLowerCase().includes(q));
  }, [board.labels, isLabelsOpen, labelQuery]);

  const allMembers = useMemo(() => {
    if (!isMembersOpen) return [];
    const list: User[] = [];
    if (board.owner) list.push(board.owner);
    (board.members || []).forEach(member => {
      if (!list.some(item => item.id === member.user.id)) {
        list.push(member.user);
      }
    });
    return list;
  }, [board.members, board.owner, isMembersOpen]);

  const filteredMembers = useMemo(() => {
    if (!isMembersOpen) return [];
    const q = memberQuery.trim().toLowerCase();
    if (!q) return allMembers;
    return allMembers.filter(member => {
      const text = `${member.first_name || ''} ${member.last_name || ''} ${member.username || ''} ${member.email || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [allMembers, isMembersOpen, memberQuery]);

  const handleToggleLabel = (labelId: number) => {
    if (!canEditCard) return;
    const currentIds = (card.labels || []).map(l => l.id);
    const nextIds = currentIds.includes(labelId)
      ? currentIds.filter(id => id !== labelId)
      : [...currentIds, labelId];
    onUpdateLabels(nextIds);
  };

  const handleCreateLabel = async () => {
    const name = newLabelName.trim();
    if (!name) return;
    await onCreateLabel(name, newLabelColor);
    setNewLabelName('');
    setNewLabelColor('#61bd4f');
  };

  const handleAttachmentUpload = async (file?: File) => {
    if (!file || isUploadingAttachment) return;
    setIsUploadingAttachment(true);
    try {
      await onAddAttachment(file);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleCreateChecklist = async () => {
    if (isCreatingChecklist) return;
    const title = newChecklistTitle.trim() || t('checklist.title');
    setIsCreatingChecklist(true);
    try {
      const created = await onAddChecklist(title);
      const createdId = typeof created === 'object' && created && 'id' in created ? Number(created.id) : NaN;
      if (!Number.isFinite(createdId)) return;

      if (checklistCopyFromId) {
        const sourceChecklist = (card.checklists || []).find(checklist => checklist.id === checklistCopyFromId);
        if (sourceChecklist?.items?.length) {
          for (const sourceItem of sourceChecklist.items) {
            const text = sourceItem.text?.trim();
            if (!text) continue;
            const createdItem = await onAddChecklistItem(createdId, text);
            const createdItemId = typeof createdItem === 'object' && createdItem && 'id' in createdItem
              ? Number((createdItem as { id?: number }).id)
              : NaN;
            if (sourceItem.is_checked && Number.isFinite(createdItemId)) {
              await onToggleChecklistItem(createdItemId, true);
            }
          }
        }
      }

      setActivePopover(null);
      setNewChecklistTitle('');
      setChecklistCopyFromId(null);
      window.setTimeout(() => checklistsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
    } finally {
      setIsCreatingChecklist(false);
    }
  };

  const modalClassName = `modal-content card-modal ${hasCover ? `has-cover cover-${coverMode}` : ''}`;

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay card-modal-overlay" onClick={onClose}>
      <div className={modalClassName} onClick={e => e.stopPropagation()}>
        {hasCover && (
          <div className="card-cover-bar" style={{ background: coverColor }} />
        )}

        {(isQuickAddOpen || activePopover) && (
          <button
            type="button"
            className="card-popover-overlay"
            aria-label={t('common.close')}
            onClick={closePopovers}
          />
        )}
        
        <CardHeader 
          card={card} 
          board={board} 
          canEdit={canEditCard} 
          onUpdateCard={onUpdateCard} 
          onCopyLink={onCopyLink}
          onCopyCard={onCopyCard}
          onArchiveToggle={() => { if (canArchiveCard) onUpdateCard({ is_archived: !card.is_archived }); }}
          onDeleteCard={() => { if (canDeleteCard) { onDeleteCard(); onClose(); } }}
          onMoveCard={onMoveCard}
          isCardMember={isCardMember}
          onJoinCard={() => { if (canJoinCard) onJoinCard(); }}
          onLeaveCard={() => { if (canLeaveCard) onLeaveCard(); }}
          onClose={onClose} 
        />

        <div className="card-modal-body">
          <div className="card-main-col">
            <div className="card-quick-actions">
              <button
                type="button"
                className={`card-quick-btn ${isQuickAddOpen ? 'active' : ''}`}
                onClick={handleQuickAdd}
                disabled={quickActionsDisabled}
              >
                <span className="card-quick-icon">＋</span>
                {t('card.quick.add')}
              </button>
              <button type="button" className="card-quick-btn" onClick={openChecklistPopover} disabled={quickActionsDisabled}>
                <span className="card-quick-icon">☑</span>
                {t('card.quick.checklist')}
              </button>
              <button
                type="button"
                className="card-quick-btn"
                onClick={() => { setIsCoverMenuOpen(false); setActivePopover('members'); }}
                disabled={quickActionsDisabled}
              >
                <span className="card-quick-icon">👥</span>
                {t('card.quick.members')}
              </button>
            </div>
            {isQuickAddOpen && (
              <div className="card-add-popover">
                <div className="card-add-title">{t('card.add.title')}</div>
                <button type="button" className="card-add-item" onClick={() => handleQuickAddItem('labels')}>
                  <span className="card-add-icon">🏷️</span>
                  <div className="card-add-text">
                    <span className="card-add-name">{t('card.add.labels')}</span>
                  </div>
                </button>
                <button type="button" className="card-add-item" onClick={() => handleQuickAddItem('checklist')}>
                  <span className="card-add-icon">☑️</span>
                  <div className="card-add-text">
                    <span className="card-add-name">{t('card.add.checklist')}</span>
                  </div>
                </button>
                <button type="button" className="card-add-item" onClick={() => handleQuickAddItem('members')}>
                  <span className="card-add-icon">👥</span>
                  <div className="card-add-text">
                    <span className="card-add-name">{t('card.add.members')}</span>
                  </div>
                </button>
                <button type="button" className="card-add-item" onClick={() => handleQuickAddItem('attachments')}>
                  <span className="card-add-icon">📎</span>
                  <div className="card-add-text">
                    <span className="card-add-name">{t('card.add.attachments')}</span>
                  </div>
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
                    onClick={() => setActivePopover(null)}
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>
                <input
                  className="form-input card-popover-search"
                  placeholder={`${t('common.search')}...`}
                  value={labelQuery}
                  onChange={e => setLabelQuery(e.target.value)}
                />
                <div className="card-popover-list">
                  {filteredLabels.length === 0 && (
                    <div className="empty-state">{t('labels.empty')}</div>
                  )}
                  {filteredLabels.map(label => (
                    <div key={label.id} className="card-popover-row">
                      <button
                        type="button"
                        className={`card-popover-item ${labelIds.has(label.id) ? 'active' : ''}`}
                        onClick={() => handleToggleLabel(label.id)}
                      >
                        <span className="card-popover-check">{labelIds.has(label.id) ? '✓' : ''}</span>
                        <span className="label-chip" style={{ background: label.color }}>{label.name}</span>
                      </button>
                      {canEditCard && (
                        <button
                          type="button"
                          className="btn-icon card-popover-delete"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                          onClick={() => {
                            if (window.confirm(t('labels.deleteConfirm'))) {
                              onDeleteLabel(label.id);
                            }
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="card-popover-footer">
                  <div className="card-label-color-grid">
                    {labelColorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`card-label-color-btn ${newLabelColor === color ? 'active' : ''}`}
                        style={{ background: color }}
                        onClick={() => setNewLabelColor(color)}
                        aria-label={color}
                      />
                    ))}
                  </div>
                  <input
                    className="form-input"
                    placeholder={t('labels.newPlaceholder')}
                    value={newLabelName}
                    onChange={e => setNewLabelName(e.target.value)}
                  />
                  <button type="button" className="btn-secondary btn-sm" onClick={handleCreateLabel}>
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
                    onClick={() => setActivePopover(null)}
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>

                <label className="checklist-create-field">
                  <span className="checklist-create-label">{t('checklist.nameLabel')}</span>
                  <input
                    className="form-input"
                    value={newChecklistTitle}
                    onChange={e => setNewChecklistTitle(e.target.value)}
                    placeholder={t('checklist.titlePlaceholder')}
                    autoFocus
                  />
                </label>

                <label className="checklist-create-field">
                  <span className="checklist-create-label">{t('checklist.copy.fromLabel')}</span>
                  <select
                    className="form-input"
                    value={checklistCopyFromId ?? ''}
                    onChange={e => {
                      const next = e.target.value ? Number(e.target.value) : null;
                      setChecklistCopyFromId(Number.isNaN(next) ? null : next);
                    }}
                  >
                    <option value="">{t('checklist.copy.none')}</option>
                    {(card.checklists || []).map(checklist => (
                      <option key={checklist.id} value={checklist.id}>
                        {checklist.title || `${t('checklist.title')} #${checklist.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => { void handleCreateChecklist(); }}
                  disabled={isCreatingChecklist}
                >
                  {isCreatingChecklist ? `${t('common.loading')}...` : t('common.add')}
                </button>
              </div>
            )}
            {activePopover === 'members' && (
              <div className="card-detail-popover">
                <div className="card-popover-header">
                  <div className="card-popover-title">{t('members.title')}</div>
                  <button
                    type="button"
                    className="btn-icon card-popover-close"
                    onClick={() => setActivePopover(null)}
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>
                <input
                  className="form-input card-popover-search"
                  placeholder={t('filters.membersLabel')}
                  value={memberQuery}
                  onChange={e => setMemberQuery(e.target.value)}
                />
                <div className="card-popover-list">
                  {filteredMembers.map(member => {
                    const isAssigned = card.members?.some(m => m.id === member.id);
                    const label = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username || member.email;
                    const initial = (label?.[0] || '?').toUpperCase();
                    const memberRole = board.members?.find(m => m.user.id === member.id)?.role;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        className={`card-popover-item ${isAssigned ? 'active' : ''}`}
                        onClick={() => {
                          if (!canManageMembers) return;
                          if (!isAssigned && memberRole === 'viewer') {
                            window.alert(t('members.viewerCannotBeAssigned'));
                            return;
                          }
                          if (isAssigned) onRemoveMember(member.id);
                          else onAddMember(member.id);
                        }}
                      >
                        <span className="card-popover-avatar">{initial}</span>
                        <div className="card-popover-member">
                          <div className="card-popover-member-name">{label}</div>
                          {member.email && <div className="card-popover-member-email">{member.email}</div>}
                        </div>
                        <span className="card-popover-check">{isAssigned ? '✓' : ''}</span>
                      </button>
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
                    onClick={() => setActivePopover(null)}
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>
                <label className="card-attachment-upload">
                  <input
                    type="file"
                    onChange={e => handleAttachmentUpload(e.target.files?.[0])}
                    disabled={!canEditCard || isUploadingAttachment}
                  />
                  <span>{t('attachments.add')}</span>
                </label>
                <div className="card-popover-list">
                  {(card.attachments || []).length === 0 && (
                    <div className="empty-state">{t('attachments.empty')}</div>
                  )}
                  {(card.attachments || []).map(att => {
                    const fileName = att.file?.split('/').pop() || att.name || t('attachments.title');
                    return (
                      <div key={att.id} className="card-attachment-row">
                        <span className="card-attachment-name">{fileName}</span>
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
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={labelsSectionRef}>
              <CardLabels 
                card={card} 
                canEdit={canEditCard}
                startEditingDueDate={startEditingDueDate}
                isOverdue={isOverdue}
                overdueText={overdueText}
                onOpenLabelsPopover={canEditCard ? () => { setIsCoverMenuOpen(false); setActivePopover('labels'); } : undefined}
              />
            </div>

            <CardDescription 
              card={card} 
              canEdit={canEditCard} 
              onUpdateCard={onUpdateCard} 
            />

            <div ref={checklistsSectionRef}>
              <CardChecklists 
                card={card} 
                canEdit={canEditCard} 
                onDeleteChecklist={onDeleteChecklist}
                onAddChecklistItem={onAddChecklistItem} 
                onDeleteChecklistItem={onDeleteChecklistItem}
                onToggleChecklistItem={onToggleChecklistItem} 
                onUpdateChecklistItem={onUpdateChecklistItem}
              />
            </div>
          </div>

          <div className="card-right-col">
            <CardComments 
              card={card} 
              user={user} 
              onAddComment={onAddComment} 
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              canEditComment={(comment) => comment.author?.id === user?.id}
              canDeleteComment={() => canDeleteCard}
              canEdit={canComment}
            />

            <div ref={coverSectionRef}>
              <CardSidebar 
                card={card} 
                canEdit={canEditCard} 
                canArchive={canArchiveCard}
                canDelete={canDeleteCard}
                canManageMembers={canManageMembers}
                canJoinCard={canJoinCard}
                canLeaveCard={canLeaveCard}
                isCardMember={isCardMember} 
                onJoinCard={onJoinCard} 
                onLeaveCard={onLeaveCard} 
                onRemoveMember={onRemoveMember}
                startEditingDueDate={startEditingDueDate}
                onCopyCard={onCopyCard}
                onUpdateCard={onUpdateCard}
                onDeleteCard={() => { if (canDeleteCard) { onDeleteCard(); onClose(); } }} 
                isEditingDueDate={isEditingDueDate}
                dueDateDate={dueDateDate}
                dueDateTime={dueDateTime}
                setDueDateDate={setDueDateDate}
                setDueDateTime={setDueDateTime}
                saveDueDate={saveDueDate}
                removeDueDate={removeDueDate}
                closeDueDateEdit={() => setIsEditingDueDate(false)}
                isCoverMenuOpen={isCoverMenuOpen}
                onToggleCoverMenu={() => setIsCoverMenuOpen(prev => !prev)}
                coverMode={coverMode}
                onCoverModeChange={handleCoverModeChange}
                onOpenCover={openCoverMenu}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
