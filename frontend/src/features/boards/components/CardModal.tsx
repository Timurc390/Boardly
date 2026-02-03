import React, { useEffect, useRef, useState } from 'react';
import { Card, Board } from '../../../types';
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
  onAddChecklist: (title: string) => void;
  onAddChecklistItem: (checklistId: number, text: string) => Promise<any> | void;
  onDeleteChecklistItem: (itemId: number, checklistId?: number) => Promise<any> | void;
  onToggleChecklistItem: (itemId: number, isChecked: boolean) => Promise<any> | void;
  onUpdateChecklistItem: (itemId: number, text: string) => Promise<any> | void;
  onAddComment: (text: string) => void;
  onUpdateLabels: (labelIds: number[]) => void;
  onCreateLabel: (name: string, color: string) => void;
  onUpdateLabel: (id: number, name: string, color: string) => void;
  onDeleteLabel: (id: number) => void;
  onJoinCard: () => void;
  onLeaveCard: () => void;
  onRemoveMember: (userId: number) => void;
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
  onAddChecklist, onAddChecklistItem, onDeleteChecklistItem, onToggleChecklistItem, onUpdateChecklistItem, onAddComment,
  onUpdateLabels, onCreateLabel, onUpdateLabel, onDeleteLabel,
  onJoinCard, onLeaveCard, onRemoveMember
}) => {
  const { user } = useAppSelector(state => state.auth);
  const { t } = useI18n();
  
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateDate, setDueDateDate] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [quickToast, setQuickToast] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [coverMode, setCoverMode] = useState<'full' | 'header'>('full');
  const labelsSectionRef = useRef<HTMLDivElement | null>(null);
  const coverSectionRef = useRef<HTMLDivElement | null>(null);

  const isOwner = board.owner?.id === user?.id;
  const isAdmin = board.members?.some(m => m.user.id === user?.id && m.role === 'admin');
  const isCardMember = card.members?.some(u => u.id === user?.id);
  const canEdit = !!(isOwner || isAdmin);
  const canManage = canEdit;
  const quickActionsDisabled = !canEdit;
  const coverColor = card.card_color?.trim();
  const hasCover = !!coverColor;

  useEffect(() => {
    if (!isOpen) {
      setIsQuickAddOpen(false);
      setIsCoverMenuOpen(false);
      return;
    }
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(`card_cover_mode_${card.id}`);
    if (stored === 'full' || stored === 'header') {
      setCoverMode(stored);
    }
  }, [card.id]);

  if (!isOpen || !user) return null;

  const startEditingDueDate = () => {
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
    if (!dueDateDate) return;
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

  const showQuickToast = (message: string) => {
    setQuickToast(message);
    window.setTimeout(() => setQuickToast(null), 2200);
  };

  const handleCoverModeChange = (mode: 'full' | 'header') => {
    setCoverMode(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`card_cover_mode_${card.id}`, mode);
    }
  };

  const openCoverMenu = () => {
    setIsCoverMenuOpen(true);
    window.setTimeout(() => coverSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
  };

  const closePopovers = () => {
    setIsQuickAddOpen(false);
    setIsCoverMenuOpen(false);
  };

  const handleQuickAdd = () => {
    setIsQuickAddOpen(prev => !prev);
    setIsCoverMenuOpen(false);
  };

  const handleQuickChecklist = () => {
    const title = window.prompt(t('checklist.titlePlaceholder'));
    if (title && title.trim()) {
      onAddChecklist(title.trim());
    }
  };

  const handleQuickAddItem = (action: 'labels' | 'dates' | 'checklist' | 'members' | 'attachments') => {
    switch (action) {
      case 'labels':
        labelsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showQuickToast(t('card.add.labelsHint'));
        break;
      case 'dates':
        startEditingDueDate();
        break;
      case 'checklist':
        handleQuickChecklist();
        break;
      case 'members':
      case 'attachments':
        showQuickToast(t('card.quick.comingSoon'));
        break;
      default:
        break;
    }
    setIsQuickAddOpen(false);
  };

  const modalClassName = `modal-content card-modal ${hasCover ? `has-cover cover-${coverMode}` : ''}`;

  return (
    <div className="modal-overlay card-modal-overlay" onClick={onClose}>
      <div className={modalClassName} onClick={e => e.stopPropagation()}>
        {hasCover && (
          <div className="card-cover-bar" style={{ background: coverColor }} />
        )}

        {(isQuickAddOpen || isCoverMenuOpen) && (
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
          canEdit={canEdit} 
          onUpdateCard={onUpdateCard} 
          onCopyLink={onCopyLink}
          onCopyCard={onCopyCard}
          onArchiveToggle={() => onUpdateCard({ is_archived: !card.is_archived })}
          onDeleteCard={() => { onDeleteCard(); onClose(); }}
          onMoveCard={onMoveCard}
          onOpenCover={openCoverMenu}
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
                + {t('card.quick.add')}
              </button>
              <button type="button" className="card-quick-btn" onClick={startEditingDueDate} disabled={quickActionsDisabled}>
                {t('card.quick.dates')}
              </button>
              <button type="button" className="card-quick-btn" onClick={handleQuickChecklist} disabled={quickActionsDisabled}>
                {t('card.quick.checklist')}
              </button>
              <button type="button" className="card-quick-btn" onClick={() => showQuickToast(t('card.quick.comingSoon'))} disabled={quickActionsDisabled}>
                {t('card.quick.attach')}
              </button>
              <button type="button" className="card-quick-btn" onClick={() => showQuickToast(t('card.quick.comingSoon'))} disabled={quickActionsDisabled}>
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
                <button type="button" className="card-add-item" onClick={() => handleQuickAddItem('dates')}>
                  <span className="card-add-icon">🗓️</span>
                  <div className="card-add-text">
                    <span className="card-add-name">{t('card.add.dates')}</span>
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
            {quickToast && <div className="card-quick-toast">{quickToast}</div>}

            <div ref={labelsSectionRef}>
              <CardLabels 
                card={card} 
                board={board} 
                canEdit={canEdit}
                onUpdateLabels={onUpdateLabels} 
                onCreateLabel={onCreateLabel}
                onUpdateLabel={onUpdateLabel}
                onDeleteLabel={onDeleteLabel}
                startEditingDueDate={startEditingDueDate}
                isOverdue={isOverdue}
                overdueText={overdueText}
              />
            </div>

            <CardDescription 
              card={card} 
              canEdit={canEdit} 
              onUpdateCard={onUpdateCard} 
            />

            <CardChecklists 
              board={board}
              card={card} 
              canEdit={canEdit} 
              onAddChecklistItem={onAddChecklistItem} 
              onDeleteChecklistItem={onDeleteChecklistItem}
              onToggleChecklistItem={onToggleChecklistItem} 
              onUpdateChecklistItem={onUpdateChecklistItem}
            />
          </div>

          <div className="card-right-col">
            <CardComments 
              card={card} 
              user={user} 
              onAddComment={onAddComment} 
              canEdit={canEdit}
            />

            <div ref={coverSectionRef}>
              <CardSidebar 
                card={card} 
                canEdit={canEdit} 
                isCardMember={isCardMember} 
                canManage={canManage}
                onJoinCard={onJoinCard} 
                onLeaveCard={onLeaveCard} 
                onRemoveMember={onRemoveMember}
                startEditingDueDate={startEditingDueDate}
                onCopyCard={onCopyCard}
                onUpdateCard={onUpdateCard}
                onDeleteCard={() => { onDeleteCard(); onClose(); }} 
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
