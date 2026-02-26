import React, { useCallback, useMemo } from 'react';
import { FiArrowRight, FiMessageCircle } from 'shared/ui/fiIcons';
import { type Board, type Card, type User } from '../../../types';
import { CardHeader } from './card_parts/CardHeader';
import { CardDescription } from './card_parts/CardDescription';
import { CardChecklists } from './card_parts/CardChecklists';
import { CardComments } from './card_parts/CardComments';
import { CardQuickActions } from './card_parts/CardQuickActions';
import { CardModalPopovers } from './card_parts/CardModalPopovers';
import { useAppSelector } from '../../../store/hooks';
import { useI18n } from '../../../context/I18nContext';
import { useCardModalAttachmentFlow } from '../hooks/useCardModalAttachmentFlow';
import { useCardModalChecklistFlow } from '../hooks/useCardModalChecklistFlow';
import { useCardModalCommentFlow } from '../hooks/useCardModalCommentFlow';
import { useCardModalPermissions } from '../hooks/useCardModalPermissions';
import { useCardModalState } from '../hooks/useCardModalState';

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
  onDeleteChecklist: (checklistId: number) => Promise<unknown> | void;
  onAddChecklistItem: (checklistId: number, text: string) => Promise<unknown> | void;
  onDeleteChecklistItem: (itemId: number, checklistId?: number) => Promise<unknown> | void;
  onToggleChecklistItem: (itemId: number, isChecked: boolean) => Promise<unknown> | void;
  onUpdateChecklistItem: (itemId: number, text: string) => Promise<unknown> | void;
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
  '#344563',
];

const coverColorOptions = [
  '#4CAF50',
  '#FBC02D',
  '#E53935',
  '#1E88E5',
  '#9E9E9E',
  '#F5F5F5',
  '#FB8C00',
  '#8E24AA',
  '#00897B',
  '#8D6E63',
];

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

  const {
    canEditCard,
    canArchiveCard,
    canDeleteCard,
    canManageMembers,
    canJoinCard,
    canLeaveCard,
    canComment,
    quickActionsDisabled,
    hasCover,
    coverMode,
    resolveCoverColor,
    isCardMember,
  } = useCardModalPermissions(card, board, user?.id);

  const boardMemberUsers = useMemo(() => {
    const usersById = new Map<number, User>();
    if (board.owner?.id) {
      usersById.set(board.owner.id, board.owner);
    }
    (board.members || []).forEach((member) => {
      if (member.user?.id) {
        usersById.set(member.user.id, member.user);
      }
    });
    return Array.from(usersById.values());
  }, [board.members, board.owner]);

  const assignedMemberIds = useMemo(
    () => new Set((card.members || []).map((member) => member.id)),
    [card.members]
  );

  const {
    isCommentsOpen,
    commentsMaxHeight,
    mainColRef,
    closeComments,
    handleToggleComments,
  } = useCardModalCommentFlow({
    isOpen,
    cardId: card.id,
    commentsLength: card.comments?.length || 0,
    checklistsLength: card.checklists?.length || 0,
  });

  const {
    dueDateDate,
    setDueDateDate,
    dueDateTime,
    setDueDateTime,
    isCoverMenuOpen,
    setIsCoverMenuOpen,
    isColorblindMode,
    setIsColorblindMode,
    activePopover,
    setActivePopover,
    labelQuery,
    setLabelQuery,
    memberQuery,
    setMemberQuery,
    newLabelName,
    setNewLabelName,
    newLabelColor,
    setNewLabelColor,
    headerCloseSignal,
    addChecklistItemSignal,
    setAddChecklistItemSignal,
    checklistsSectionRef,
    dialogRef,
    closeAllCardOverlays,
    startEditingDueDate,
    saveDueDate,
    removeDueDate,
    handleCoverModeChange,
    openCoverMenu,
    labelIds,
    isLabelsOpen,
    isDueDateOpen,
    filteredLabels,
    filteredMembers,
    handleToggleLabel,
    hasChecklists,
  } = useCardModalState({
    isOpen,
    onClose,
    card,
    boardMembers: boardMemberUsers,
    boardLabels: board.labels || [],
    onUpdateCard,
    canEditCard,
    closeComments,
    requireDueDateMessage: t('card.dueDateRequired'),
  });

  const displayCoverColor = resolveCoverColor(card.card_color, isColorblindMode);

  const { isUploadingAttachment, handleAttachmentUpload, resolveAttachmentUrl } = useCardModalAttachmentFlow({
    onAddAttachment,
  });

  const {
    newChecklistTitle,
    setNewChecklistTitle,
    checklistCopyFromId,
    setChecklistCopyFromId,
    isCreatingChecklist,
    handleCreateChecklist,
  } = useCardModalChecklistFlow({
    card,
    onAddChecklist,
    onAddChecklistItem,
    onToggleChecklistItem,
    setActivePopover,
    scrollToChecklists: () => {
      checklistsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    defaultChecklistTitle: t('checklist.title'),
  });

  const handleCreateLabel = useCallback(async () => {
    const name = newLabelName.trim();
    if (!name) return;
    await onCreateLabel(name, newLabelColor);
    setNewLabelName('');
    setNewLabelColor('#61bd4f');
  }, [newLabelColor, newLabelName, onCreateLabel, setNewLabelColor, setNewLabelName]);

  const modalClassName = `modal-content card-modal ${hasCover ? `has-cover cover-${coverMode}` : ''} ${isColorblindMode ? 'colorblind' : ''}`;
  const mainCardStyle = useMemo<React.CSSProperties>(
    () => ({ ['--open-card-cover' as string]: displayCoverColor || '#2e79af' }),
    [displayCoverColor]
  );
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay card-modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className={modalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        {hasCover && (
          <div className="card-cover-bar" style={{ background: displayCoverColor }} />
        )}

        <div className={`card-modal-body ${isCoverMenuOpen ? 'has-cover-menu' : ''} ${isCommentsOpen ? 'has-comments' : ''}`}>
          <CardModalPopovers
            card={card}
            board={board}
            activePopover={activePopover}
            isDueDateOpen={isDueDateOpen}
            isCoverMenuOpen={isCoverMenuOpen}
            isColorblindMode={isColorblindMode}
            canEditCard={canEditCard}
            canManageMembers={canManageMembers}
            isUploadingAttachment={isUploadingAttachment}
            dueDateDate={dueDateDate}
            dueDateTime={dueDateTime}
            labelQuery={labelQuery}
            memberQuery={memberQuery}
            labelIds={labelIds}
            filteredLabels={filteredLabels}
            filteredMembers={filteredMembers}
            assignedMemberIds={assignedMemberIds}
            newLabelName={newLabelName}
            newLabelColor={newLabelColor}
            coverColorOptions={coverColorOptions}
            labelColorOptions={labelColorOptions}
            resolveCoverColor={resolveCoverColor}
            resolveAttachmentUrl={resolveAttachmentUrl}
            onSetActivePopover={setActivePopover}
            onSetDueDateDate={setDueDateDate}
            onSetDueDateTime={setDueDateTime}
            onSetCoverMenuOpen={setIsCoverMenuOpen}
            onToggleColorblindMode={() => setIsColorblindMode((prev) => !prev)}
            onSetLabelQuery={setLabelQuery}
            onSetMemberQuery={setMemberQuery}
            onSetNewLabelName={setNewLabelName}
            onSetNewLabelColor={setNewLabelColor}
            onToggleLabel={(labelId) => handleToggleLabel(labelId, onUpdateLabels)}
            onDeleteLabel={onDeleteLabel}
            onCreateLabel={() => { void handleCreateLabel(); }}
            onUpdateCardColor={(color) => onUpdateCard({ card_color: color })}
            onHandleCoverModeChange={handleCoverModeChange}
            coverMode={coverMode}
            checklistCopyFromId={checklistCopyFromId}
            onSetChecklistCopyFromId={setChecklistCopyFromId}
            newChecklistTitle={newChecklistTitle}
            onSetNewChecklistTitle={setNewChecklistTitle}
            onCreateChecklist={() => { void handleCreateChecklist(); }}
            isCreatingChecklist={isCreatingChecklist}
            onSaveDueDate={saveDueDate}
            onRemoveDueDate={removeDueDate}
            onAttachmentUpload={handleAttachmentUpload}
            onDeleteAttachment={onDeleteAttachment}
            onRemoveMember={onRemoveMember}
            onAddMember={onAddMember}
            t={t}
          />
          <div className="card-main-col" style={mainCardStyle} ref={mainColRef}>
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
              onOpenCover={openCoverMenu}
              closeSignal={headerCloseSignal}
              onOpenHeaderMenu={() => {
                closeAllCardOverlays({ keepComments: true, keepCover: true, keepHeaderMenus: true });
              }}
              onClose={onClose}
            />
            <CardQuickActions
              isLabelsOpen={isLabelsOpen}
              isDueDateOpen={isDueDateOpen}
              activePopover={activePopover}
              quickActionsDisabled={quickActionsDisabled}
              onOpenLabels={() => {
                closeAllCardOverlays();
                setActivePopover('labels');
              }}
              onOpenDueDate={startEditingDueDate}
              onOpenAttachments={() => {
                closeAllCardOverlays();
                setActivePopover('attachments');
              }}
              onOpenMembers={() => {
                closeAllCardOverlays();
                setActivePopover('members');
              }}
              t={t}
            />

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
                openAddItemSignal={addChecklistItemSignal}
              />
            </div>
            <div className="card-main-footer">
              <button
                type="button"
                className="checklist-add-trigger"
                onClick={() => setAddChecklistItemSignal((v) => v + 1)}
                disabled={!canEditCard || !hasChecklists}
              >
                + {t('checklist.addItem')}
              </button>
              <button
                type="button"
                className={`card-comments-launch ${isCommentsOpen ? 'active' : ''}`}
                onClick={() => handleToggleComments(() => {
                  closeAllCardOverlays({ keepComments: true, keepCover: true });
                })}
              >
                <span className="card-comments-launch-icon"><FiMessageCircle aria-hidden="true" /></span>
                <span>{t('comments.title')}</span>
                <span aria-hidden="true"><FiArrowRight /></span>
              </button>
            </div>
          </div>

          {isCommentsOpen && (
            <div className="card-comments-col" style={commentsMaxHeight ? { maxHeight: `${commentsMaxHeight}px` } : undefined}>
              <CardComments
                card={card}
                user={user}
                onAddComment={onAddComment}
                onUpdateComment={onUpdateComment}
                onDeleteComment={onDeleteComment}
                canEditComment={(comment) => comment.author?.id === user?.id}
                canDeleteComment={() => canDeleteCard}
                canEdit={canComment}
                onClose={closeComments}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
