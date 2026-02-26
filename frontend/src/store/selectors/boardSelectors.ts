import { createSelector } from '@reduxjs/toolkit';
import { type RootState } from '../store';
import { type Board, type Card, type List } from '../../types';

type BoardMember = NonNullable<Board['members']>[number];

export const selectBoardState = (state: RootState) => state.board;
export const selectCurrentBoard = (state: RootState) => state.board.currentBoard;
export const selectAuthUserId = (state: RootState) => state.auth.user?.id;

const selectUserIdArg = (_state: RootState, userId?: number) => userId;

export const selectBoardDerivedByUser = createSelector(
  [selectCurrentBoard, selectUserIdArg],
  (board, userId) => {
    const boardId = board?.id ?? 0;
    const members = board?.members || [];
    const currentMembership = members.find((member: BoardMember) => member.user.id === userId);
    const role = currentMembership?.role;

    const isOwner = board?.owner?.id === userId;
    const isAdmin = role === 'admin';
    const isDeveloper = role === 'developer';

    const canManageMembers = isOwner || isAdmin;
    const canEditBoard = isOwner || isAdmin;
    const canCreateList = canEditBoard || (isDeveloper && Boolean(board?.dev_can_create_lists));
    const canLeaveBoard = Boolean(currentMembership) && !isOwner;

    const boardLists = board?.lists || [];
    const boardCards = boardLists.flatMap((list: List) => list.cards || []);
    const boardListsById = new Map<number, List>(boardLists.map((list: List) => [list.id, list]));
    const activeLists = boardLists.filter((list: List) => !list.is_archived);
    const archivedLists = boardLists.filter((list: List) => list.is_archived);
    const archivedCards = boardLists.flatMap((list: List) => (list.cards || []).filter((card: Card) => card.is_archived));

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
      boardCards,
      boardListsById,
      activeLists,
      archivedLists,
      archivedCards,
    };
  }
);
