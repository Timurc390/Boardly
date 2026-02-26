import { Dispatch, SetStateAction, useCallback } from 'react';
import { Card } from '../../../types';
import {
  addAttachmentAction,
  addCardMemberAction,
  addChecklistAction,
  addChecklistItemAction,
  addCommentAction,
  copyCardAction,
  createLabelAction,
  deleteAttachmentAction,
  deleteCardAction,
  deleteChecklistAction,
  deleteChecklistItemAction,
  deleteCommentAction,
  deleteLabelAction,
  joinCardAction,
  leaveCardAction,
  removeCardMemberAction,
  updateCardAction,
  updateChecklistItemAction,
  updateCommentAction,
  updateLabelAction,
} from '../../../store/slices/boardSlice';
import { RunBoardAction } from './useBoardActionRunner';

type UseBoardCardModalActionsOptions = {
  boardId: number;
  selectedCard: Card | null;
  setSelectedCard: Dispatch<SetStateAction<Card | null>>;
  runBoardAction: RunBoardAction;
  showTopToast: (message: string) => void;
  t: (key: string) => string;
  handleUpdateSelectedCard: (data: Partial<Card> & { label_ids?: number[] }) => void;
  handleUpdateCardLabels: (labelIds: number[]) => void;
  handleMoveCard: (cardId: number, sourceListId: number, destListId: number, destIndex: number) => void;
};

export const useBoardCardModalActions = ({
  boardId,
  selectedCard,
  setSelectedCard,
  runBoardAction,
  showTopToast,
  t,
  handleUpdateSelectedCard,
  handleUpdateCardLabels,
  handleMoveCard,
}: UseBoardCardModalActionsOptions) => {
  const handleCloseCardModal = useCallback(() => {
    setSelectedCard(null);
  }, [setSelectedCard]);

  const handleCopyCardLink = useCallback(async () => {
    if (!selectedCard) return;
    const url = `${window.location.origin}/boards/${boardId}?card=${selectedCard.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showTopToast(t('common.linkCopied'));
    } catch {
      window.prompt(t('card.menu.copyLinkPrompt'), url);
    }
  }, [boardId, selectedCard, showTopToast, t]);

  const handleDeleteCard = useCallback(() => {
    if (!selectedCard) return;
    void runBoardAction(deleteCardAction(selectedCard.id));
  }, [runBoardAction, selectedCard]);

  const handleCopyCard = useCallback(() => {
    if (!selectedCard) return;
    void runBoardAction(copyCardAction({ cardId: selectedCard.id, listId: selectedCard.list }));
  }, [runBoardAction, selectedCard]);

  const handleAddChecklist = useCallback(
    (title: string) => {
      if (!selectedCard) return;
      return runBoardAction<{ id?: number } | null | void>(
        addChecklistAction({ cardId: selectedCard.id, title })
      );
    },
    [runBoardAction, selectedCard]
  );

  const handleDeleteChecklist = useCallback(
    (checklistId: number) => {
      if (!selectedCard) return;
      return runBoardAction(deleteChecklistAction({ checklistId, cardId: selectedCard.id }));
    },
    [runBoardAction, selectedCard]
  );

  const handleAddChecklistItem = useCallback(
    (checklistId: number, text: string) => runBoardAction(addChecklistItemAction({ checklistId, text })),
    [runBoardAction]
  );

  const handleDeleteChecklistItem = useCallback(
    (itemId: number, checklistId?: number) => {
      if (typeof checklistId !== 'number') return;
      return runBoardAction(deleteChecklistItemAction({ itemId, checklistId }));
    },
    [runBoardAction]
  );

  const handleToggleChecklistItem = useCallback(
    (itemId: number, isChecked: boolean) => runBoardAction(updateChecklistItemAction({ itemId, data: { is_checked: isChecked } })),
    [runBoardAction]
  );

  const handleUpdateChecklistItem = useCallback(
    (itemId: number, text: string) => runBoardAction(updateChecklistItemAction({ itemId, data: { text } })),
    [runBoardAction]
  );

  const handleAddComment = useCallback(
    (text: string) => {
      if (!selectedCard) return;
      void runBoardAction(addCommentAction({ cardId: selectedCard.id, text }));
    },
    [runBoardAction, selectedCard]
  );

  const handleUpdateComment = useCallback(
    (commentId: number, text: string) => {
      void runBoardAction(updateCommentAction({ commentId, text }));
    },
    [runBoardAction]
  );

  const handleDeleteComment = useCallback(
    (commentId: number) => {
      void runBoardAction(deleteCommentAction({ commentId }));
    },
    [runBoardAction]
  );

  const handleCreateLabel = useCallback(
    async (name: string, color: string) => {
      if (!selectedCard) return;
      const createdRaw = await runBoardAction<{ id?: number } | void>(
        createLabelAction({ boardId, name, color })
      );
      const created = createdRaw ?? undefined;
      if (!created?.id) return created;

      const currentIds = (selectedCard.labels || []).map((label) => label.id);
      if (!currentIds.includes(created.id)) {
        await runBoardAction(
          updateCardAction({
            cardId: selectedCard.id,
            data: { label_ids: [...currentIds, created.id] },
          })
        );
      }

      return created;
    },
    [boardId, runBoardAction, selectedCard]
  );

  const handleUpdateLabel = useCallback(
    (id: number, name: string, color: string) => {
      void runBoardAction(updateLabelAction({ id, data: { name, color } }));
    },
    [runBoardAction]
  );

  const handleDeleteLabel = useCallback(
    (id: number) => {
      setSelectedCard((prev) =>
        prev ? { ...prev, labels: (prev.labels || []).filter((label) => label.id !== id) } : prev
      );
      void runBoardAction(deleteLabelAction(id));
    },
    [runBoardAction, setSelectedCard]
  );

  const handleJoinCard = useCallback(() => {
    if (!selectedCard) return;
    void runBoardAction(joinCardAction(selectedCard.id));
  }, [runBoardAction, selectedCard]);

  const handleLeaveCard = useCallback(() => {
    if (!selectedCard) return;
    void runBoardAction(leaveCardAction(selectedCard.id));
  }, [runBoardAction, selectedCard]);

  const handleRemoveCardMember = useCallback(
    (userId: number) => {
      if (!selectedCard) return;
      void runBoardAction(removeCardMemberAction({ cardId: selectedCard.id, userId }));
    },
    [runBoardAction, selectedCard]
  );

  const handleAddCardMember = useCallback(
    (userId: number) => {
      if (!selectedCard) return;
      void runBoardAction(addCardMemberAction({ cardId: selectedCard.id, userId }));
    },
    [runBoardAction, selectedCard]
  );

  const handleAddAttachment = useCallback(
    async (file: File) => {
      if (!selectedCard) return;
      const result = await runBoardAction<void>(addAttachmentAction({ cardId: selectedCard.id, file }));
      return result ?? undefined;
    },
    [runBoardAction, selectedCard]
  );

  const handleDeleteAttachment = useCallback(
    (attachmentId: number) => {
      if (!selectedCard) return;
      void runBoardAction(deleteAttachmentAction({ cardId: selectedCard.id, attachmentId }));
    },
    [runBoardAction, selectedCard]
  );

  return {
    handleCloseCardModal,
    handleCopyCardLink,
    handleDeleteCard,
    handleCopyCard,
    handleAddChecklist,
    handleDeleteChecklist,
    handleAddChecklistItem,
    handleDeleteChecklistItem,
    handleToggleChecklistItem,
    handleUpdateChecklistItem,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleCreateLabel,
    handleUpdateLabel,
    handleDeleteLabel,
    handleJoinCard,
    handleLeaveCard,
    handleRemoveCardMember,
    handleAddCardMember,
    handleAddAttachment,
    handleDeleteAttachment,
    handleUpdateSelectedCard,
    handleUpdateCardLabels,
    handleMoveCard,
  };
};
