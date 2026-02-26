import { Dispatch, FormEvent, SetStateAction, useCallback } from 'react';
import { Board, Card, List } from '../../../types';
import {
  addCardAction,
  addListAction,
  copyListAction,
  deleteListAction,
  fetchBoardById,
  moveCardAction,
  moveCardOptimistic,
  moveListAction,
  moveListOptimistic,
  updateBoardAction,
  updateCardAction,
  updateListAction,
  updateListOptimistic,
} from '../../../store/slices/boardSlice';
import { AppDispatch } from '../../../store/store';
import { confirmAction } from '../../../shared/utils/confirm';

type UseBoardListActionsOptions = {
  dispatch: AppDispatch;
  t: (key: string) => string;
  boardId: number;
  board: Board | null;
  boardTitle: string;
  boardListsById: Map<number, List>;
  boardCards: Card[];
  filteredListsLength: number;
  canCreateList: boolean;
  canEditBoard: boolean;
  canEditCard: (card: Card) => boolean;
  canAddCardToList: (list: List) => boolean;
  newListTitle: string;
  setNewListTitle: Dispatch<SetStateAction<string>>;
  setIsAddingList: Dispatch<SetStateAction<boolean>>;
  setCollapsedLists: Dispatch<SetStateAction<number[]>>;
  isListMovePending: boolean;
  setIsListMovePending: Dispatch<SetStateAction<boolean>>;
};

export const useBoardListActions = ({
  dispatch,
  t,
  boardId,
  board,
  boardTitle,
  boardListsById,
  boardCards,
  filteredListsLength,
  canCreateList,
  canEditBoard,
  canEditCard,
  canAddCardToList,
  newListTitle,
  setNewListTitle,
  setIsAddingList,
  setCollapsedLists,
  isListMovePending,
  setIsListMovePending,
}: UseBoardListActionsOptions) => {
  const handleCreateList = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!canCreateList) return;
      if (!newListTitle.trim()) return;
      if (!boardId) return;

      const order = board?.lists ? board.lists.length + 1 : 1;
      dispatch(addListAction({ boardId, title: newListTitle, order }));
      setNewListTitle('');
      setIsAddingList(false);
    },
    [board?.lists, boardId, canCreateList, dispatch, newListTitle, setIsAddingList, setNewListTitle]
  );

  const handleAddCard = useCallback(
    (listId: number, title: string) => {
      const list = boardListsById.get(listId);
      if (!list || !canAddCardToList(list)) return;

      const order = (list.cards?.length || 0) + 1;
      dispatch(addCardAction({ listId, title, order }));
    },
    [boardListsById, canAddCardToList, dispatch]
  );

  const handleUpdateList = useCallback(
    (listId: number, data: Partial<List>) => {
      dispatch(updateListOptimistic({ listId, data }));
      dispatch(updateListAction({ listId, data }));
    },
    [dispatch]
  );

  const handleDeleteList = useCallback(
    (listId: number) => {
      if (!confirmAction(t('common.confirmDelete'))) return;
      dispatch(deleteListAction(listId));
    },
    [dispatch, t]
  );

  const handleCopyList = useCallback(
    (listId: number) => {
      dispatch(copyListAction({ listId }));
    },
    [dispatch]
  );

  const handleArchiveAllCardsInList = useCallback(
    (listId: number) => {
      const list = boardListsById.get(listId);
      if (!list) return;
      if (!confirmAction(t('list.archiveAllCardsConfirm'))) return;

      (list.cards || [])
        .filter((card) => !card.is_archived)
        .forEach((card) => {
          dispatch(updateCardAction({ cardId: card.id, data: { is_archived: true } }));
        });
    },
    [boardListsById, dispatch, t]
  );

  const handleToggleCardComplete = useCallback(
    (cardId: number, next: boolean) => {
      dispatch(updateCardAction({ cardId, data: { is_completed: next } }));
    },
    [dispatch]
  );

  const handleTitleBlur = useCallback(() => {
    if (!boardId || !board) return;
    if (boardTitle === board.title) return;
    dispatch(updateBoardAction({ id: boardId, data: { title: boardTitle } }));
  }, [board, boardId, boardTitle, dispatch]);

  const handleMoveList = useCallback(
    async (listId: number, fromIndex: number, toIndex: number) => {
      if (!canEditBoard) return;
      if (fromIndex === toIndex || toIndex < 0 || toIndex >= filteredListsLength) return;
      if (isListMovePending) return;

      const requestedOrder = toIndex + 1;
      setIsListMovePending(true);
      dispatch(moveListOptimistic({ listId, destIndex: toIndex }));
      try {
        await dispatch(moveListAction({ listId, order: requestedOrder })).unwrap();
        // Do not force-refresh board here: incoming refetch during the next drag
        // can interrupt DnD session and produce "start without end" behavior.
      } catch {
        if (boardId) {
          dispatch(fetchBoardById(boardId));
        }
      } finally {
        setIsListMovePending(false);
      }
    },
    [boardId, canEditBoard, dispatch, filteredListsLength, isListMovePending, setIsListMovePending]
  );

  const handleMoveCard = useCallback(
    (cardId: number, sourceListId: number, destListId: number, destIndex: number) => {
      if (!canEditBoard) {
        const card = boardCards.find((item) => item.id === cardId);
        const targetList = boardListsById.get(destListId);
        if (!card || !targetList) return;
        if (!canEditCard(card)) return;
        if (!canAddCardToList(targetList)) return;
      }
      if (destIndex < 0) return;

      dispatch(moveCardOptimistic({ cardId, sourceListId, destListId, newIndex: destIndex }));
      dispatch(moveCardAction({ cardId, listId: destListId, order: destIndex + 1 }));
    },
    [boardCards, boardListsById, canAddCardToList, canEditBoard, canEditCard, dispatch]
  );

  const toggleListCollapse = useCallback((listId: number) => {
    setCollapsedLists((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    );
  }, [setCollapsedLists]);

  return {
    handleCreateList,
    handleAddCard,
    handleUpdateList,
    handleDeleteList,
    handleCopyList,
    handleArchiveAllCardsInList,
    handleToggleCardComplete,
    handleTitleBlur,
    handleMoveList,
    handleMoveCard,
    toggleListCollapse,
  };
};
