import { Dispatch, SetStateAction, useCallback } from 'react';
import { Card, Label } from '../../../types';
import { fetchBoardById, updateCardAction } from '../../../store/slices/boardSlice';
import { AppDispatch } from '../../../store/store';
import { RunBoardAction } from './useBoardActionRunner';

type UseBoardCardActionsOptions = {
  dispatch: AppDispatch;
  boardIdParam?: string;
  selectedCard: Card | null;
  setSelectedCard: Dispatch<SetStateAction<Card | null>>;
  boardLabels: Label[];
  runBoardAction: RunBoardAction;
  actionFailedMessage: string;
  closeTransientOverlays: () => void;
};

export const useBoardCardActions = ({
  dispatch,
  boardIdParam,
  selectedCard,
  setSelectedCard,
  boardLabels,
  runBoardAction,
  actionFailedMessage,
  closeTransientOverlays,
}: UseBoardCardActionsOptions) => {
  const handleUpdateSelectedCard = useCallback(
    (data: Partial<Card> & { label_ids?: number[] }) => {
      if (!selectedCard) return;
      const { label_ids, ...rest } = data;
      setSelectedCard((prev) => (prev ? { ...prev, ...rest } : prev));
      dispatch(updateCardAction({ cardId: selectedCard.id, data }))
        .unwrap()
        .catch((error: unknown) => {
          const details = error as {
            detail?: string;
            response?: { data?: { detail?: string; message?: string } };
            message?: string;
          };
          const message =
            details.detail ||
            details.response?.data?.detail ||
            details.response?.data?.message ||
            details.message ||
            actionFailedMessage;
          alert(message);
          if (boardIdParam) {
            dispatch(fetchBoardById(Number(boardIdParam)));
          }
        });
    },
    [actionFailedMessage, boardIdParam, dispatch, selectedCard, setSelectedCard]
  );

  const handleUpdateCardLabels = useCallback(
    (labelIds: number[]) => {
      if (!selectedCard) return;
      const nextLabels = boardLabels.filter((label) => labelIds.includes(label.id));
      setSelectedCard((prev) => (prev ? { ...prev, labels: nextLabels } : prev));
      void runBoardAction(updateCardAction({ cardId: selectedCard.id, data: { label_ids: labelIds } }));
    },
    [boardLabels, runBoardAction, selectedCard, setSelectedCard]
  );

  const handleCardOpen = useCallback(
    (card: Card) => {
      closeTransientOverlays();
      setSelectedCard(card);
    },
    [closeTransientOverlays, setSelectedCard]
  );

  return {
    handleUpdateSelectedCard,
    handleUpdateCardLabels,
    handleCardOpen,
  };
};
