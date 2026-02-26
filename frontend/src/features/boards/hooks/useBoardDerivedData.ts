import { useCallback, useMemo } from 'react';
import { Board, Card, List } from '../../../types';

type BoardMember = NonNullable<Board['members']>[number];

type UseBoardDerivedDataOptions = {
  board: Board | null;
  userId?: number;
};

export const useBoardDerivedData = ({ board, userId }: UseBoardDerivedDataOptions) => {
  const boardId = board?.id ?? 0;
  const isOwner = board?.owner?.id === userId;
  const currentMembership = board?.members?.find((member: BoardMember) => member.user.id === userId);
  const role = currentMembership?.role;
  const isAdmin = role === 'admin';
  const isDeveloper = role === 'developer';

  const canManageMembers = isOwner || isAdmin;
  const canEditBoard = isOwner || isAdmin;
  const canCreateList = canEditBoard || (isDeveloper && !!board?.dev_can_create_lists);
  const canLeaveBoard = !!currentMembership && !isOwner;

  const canAddCardToList = useCallback(
    (list: List) => {
      if (canEditBoard) return true;
      if (isDeveloper && board?.dev_can_create_cards && list.allow_dev_add_cards) return true;
      return false;
    },
    [board?.dev_can_create_cards, canEditBoard, isDeveloper]
  );

  const canEditCard = useCallback(
    (card: Card) => {
      if (canEditBoard) return true;
      if (isDeveloper && board?.dev_can_edit_assigned_cards && card.members?.some((member) => member.id === userId)) {
        return true;
      }
      return false;
    },
    [board?.dev_can_edit_assigned_cards, canEditBoard, isDeveloper, userId]
  );

  const boardCards = useMemo(
    () => board?.lists?.flatMap((list: List) => list.cards || []) || [],
    [board?.lists]
  );

  const boardListsById = useMemo(() => {
    const next = new Map<number, List>();
    (board?.lists || []).forEach((list: List) => next.set(list.id, list));
    return next;
  }, [board?.lists]);

  const activeLists = useMemo(
    () => board?.lists?.filter((list: List) => !list.is_archived) || [],
    [board?.lists]
  );

  const archivedLists = useMemo(
    () => board?.lists?.filter((list: List) => list.is_archived) || [],
    [board?.lists]
  );

  const archivedCards = useMemo(
    () => board?.lists?.flatMap((list: List) => (list.cards || []).filter((card: Card) => card.is_archived)) || [],
    [board?.lists]
  );

  return {
    boardId,
    isOwner,
    currentMembership,
    role,
    isAdmin,
    isDeveloper,
    canManageMembers,
    canEditBoard,
    canCreateList,
    canLeaveBoard,
    canAddCardToList,
    canEditCard,
    boardCards,
    boardListsById,
    activeLists,
    archivedLists,
    archivedCards,
  };
};
