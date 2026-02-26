import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { Attachment, Card } from '../../../types';
import {
  addAttachmentAction,
  addCardAction,
  addCardMemberAction,
  addChecklistAction,
  addChecklistItemAction,
  addCommentAction,
  addListAction,
  createBoardAction,
  copyCardAction,
  copyListAction,
  createLabelAction,
  deleteCardAction,
  deleteChecklistAction,
  deleteChecklistItemAction,
  deleteCommentAction,
  deleteLabelAction,
  deleteListAction,
  deleteAttachmentAction,
  fetchBoardsAction,
  fetchBoardById,
  joinCardAction,
  leaveCardAction,
  moveListAction,
  removeBoardMemberAction,
  removeCardMemberAction,
  toggleFavoriteAction,
  updateBoardAction,
  updateBoardMemberRoleAction,
  updateCardAction,
  updateChecklistItemAction,
  updateCommentAction,
  updateLabelAction,
  updateListAction,
} from './thunks';
import {
  ensureLists,
  reorderActiveListsById,
  upsertCardIntoLists,
  upsertListIntoLists,
} from './helpers';
import {
  addAttachmentToCard,
  addChecklistItemToLists,
  addChecklistToCard,
  addCommentToCard,
  applyLabelDeleteEverywhere,
  applyLabelUpsertEverywhere,
  deleteAttachmentFromCard,
  deleteChecklistFromLists,
  deleteChecklistItemFromLists,
  deleteCommentFromLists,
  updateChecklistItemInLists,
  updateCommentInLists,
} from './mutations';
import { BoardState } from './types';

export const buildBoardExtraReducers = (builder: ActionReducerMapBuilder<BoardState>) => {
  builder
    .addCase(fetchBoardsAction.pending, (state) => {
      state.boardsLoading = true;
      state.boardsError = null;
    })
    .addCase(fetchBoardsAction.fulfilled, (state, action) => {
      state.boardsLoading = false;
      state.boards = action.payload;
    })
    .addCase(fetchBoardsAction.rejected, (state, action) => {
      state.boardsLoading = false;
      state.boardsError = action.payload as string;
    })
    .addCase(createBoardAction.fulfilled, (state, action) => {
      const exists = state.boards.some((board) => board.id === action.payload.id);
      if (!exists) state.boards.push(action.payload);
    })
    .addCase(fetchBoardById.fulfilled, (state, action) => {
      if (state.activeBoardFetchRequestId && state.activeBoardFetchRequestId !== action.meta.requestId) {
        return;
      }
      state.loading = false;
      state.currentBoard = action.payload;
      state.activeBoardFetchRequestId = null;
    })
    .addCase(fetchBoardById.pending, (state, action) => {
      state.loading = true;
      state.activeBoardFetchRequestId = action.meta.requestId;
      const nextId = action.meta.arg as number;
      if (!state.currentBoard || state.currentBoard.id !== nextId) {
        state.isLive = false;
      }
    })
    .addCase(fetchBoardById.rejected, (state, action) => {
      if (state.activeBoardFetchRequestId && state.activeBoardFetchRequestId !== action.meta.requestId) {
        return;
      }
      state.loading = false;
      state.error = action.payload as string;
      state.activeBoardFetchRequestId = null;
    })
    .addCase(updateBoardAction.fulfilled, (state, action) => {
      if (state.currentBoard) state.currentBoard = { ...state.currentBoard, ...action.payload };
    })
    .addCase(toggleFavoriteAction.fulfilled, (state, action) => {
      if (state.currentBoard) state.currentBoard.is_favorite = action.payload.is_favorite;
    })
    .addCase(addListAction.fulfilled, (state, action) => {
      if (!state.currentBoard?.lists) return;
      upsertListIntoLists(state.currentBoard.lists, action.payload);
    })
    .addCase(updateListAction.fulfilled, (state, action) => {
      if (!state.currentBoard?.lists) return;
      const idx = state.currentBoard.lists.findIndex((list) => list.id === action.payload.id);
      if (idx !== -1) {
        state.currentBoard.lists[idx] = { ...state.currentBoard.lists[idx], ...action.payload };
      }
    })
    .addCase(deleteListAction.fulfilled, (state, action) => {
      if (state.currentBoard) {
        state.currentBoard.lists = state.currentBoard.lists?.filter((list) => list.id !== action.payload);
      }
    })
    .addCase(removeBoardMemberAction.fulfilled, (state, action) => {
      if (!state.currentBoard?.members) return;
      state.currentBoard.members = state.currentBoard.members.filter((member) => member.id !== action.payload);
    })
    .addCase(updateBoardMemberRoleAction.fulfilled, (state, action) => {
      if (!state.currentBoard?.members) return;
      const idx = state.currentBoard.members.findIndex((member) => member.id === action.payload.id);
      if (idx !== -1) {
        state.currentBoard.members[idx] = { ...state.currentBoard.members[idx], ...action.payload };
      }
    })
    .addCase(copyListAction.fulfilled, (state, action) => {
      if (!state.currentBoard?.lists) return;
      upsertListIntoLists(state.currentBoard.lists, action.payload);
    })
    .addCase(moveListAction.fulfilled, (state, action) => {
      if (!state.currentBoard?.lists) return;
      const requestedOrder = Number(action.meta.arg?.order);
      if (Number.isFinite(requestedOrder) && requestedOrder > 0) {
        reorderActiveListsById(state.currentBoard.lists, action.payload.id, requestedOrder - 1);
      }
      upsertListIntoLists(state.currentBoard.lists, action.payload);
    })
    .addCase(addCardAction.fulfilled, (state, action) => {
      const list = state.currentBoard?.lists?.find((item) => item.id === action.payload.list);
      if (!list) return;
      if (!list.cards) list.cards = [];
      const idx = list.cards.findIndex((card) => card.id === action.payload.id);
      if (idx !== -1) list.cards[idx] = action.payload;
      else list.cards.push(action.payload);
    })
    .addCase(copyCardAction.fulfilled, (state, action) => {
      const list = state.currentBoard?.lists?.find((item) => item.id === action.payload.list);
      if (!list) return;
      if (!list.cards) list.cards = [];
      const idx = list.cards.findIndex((card) => card.id === action.payload.id);
      if (idx !== -1) list.cards[idx] = action.payload;
      else list.cards.push(action.payload);
    })
    .addCase(updateCardAction.fulfilled, (state, action) => {
      state.currentBoard?.lists?.forEach((list) => {
        const idx = list.cards?.findIndex((card) => card.id === action.payload.id);
        if (idx !== undefined && idx !== -1 && list.cards) list.cards[idx] = action.payload;
      });
    })
    .addCase(deleteCardAction.fulfilled, (state, action) => {
      state.currentBoard?.lists?.forEach((list) => {
        if (list.cards) list.cards = list.cards.filter((card) => card.id !== action.payload);
      });
    })
    .addCase(createLabelAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      applyLabelUpsertEverywhere(state, lists, action.payload);
    })
    .addCase(updateLabelAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      applyLabelUpsertEverywhere(state, lists, action.payload);
    })
    .addCase(deleteLabelAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      applyLabelDeleteEverywhere(state, lists, action.payload);
    })
    .addCase(removeCardMemberAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      const updatedCard = action.payload as Card;
      upsertCardIntoLists(lists, updatedCard);
    })
    .addCase(addCardMemberAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      const updatedCard = action.payload as Card;
      upsertCardIntoLists(lists, updatedCard);
    })
    .addCase(joinCardAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      const updatedCard = action.payload as Card;
      upsertCardIntoLists(lists, updatedCard);
    })
    .addCase(leaveCardAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      const updatedCard = action.payload as Card;
      upsertCardIntoLists(lists, updatedCard);
    })
    .addCase(addAttachmentAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      const { attachment, cardId } = action.payload as { attachment: Attachment; cardId: number };
      addAttachmentToCard(lists, cardId, attachment);
    })
    .addCase(deleteAttachmentAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      const { cardId, attachmentId } = action.payload as { cardId: number; attachmentId: number };
      deleteAttachmentFromCard(lists, cardId, attachmentId);
    })
    .addCase(addChecklistAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      const cardId = action.meta.arg.cardId;
      addChecklistToCard(lists, cardId, action.payload);
    })
    .addCase(deleteChecklistAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      deleteChecklistFromLists(lists, action.payload);
    })
    .addCase(addChecklistItemAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      const checklistId = action.meta.arg.checklistId;
      addChecklistItemToLists(lists, checklistId, action.payload);
    })
    .addCase(updateChecklistItemAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      updateChecklistItemInLists(lists, action.payload);
    })
    .addCase(deleteChecklistItemAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      deleteChecklistItemFromLists(lists, action.payload);
    })
    .addCase(addCommentAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      addCommentToCard(lists, action.meta.arg.cardId, action.payload);
    })
    .addCase(updateCommentAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      updateCommentInLists(lists, action.payload);
    })
    .addCase(deleteCommentAction.fulfilled, (state, action) => {
      const lists = ensureLists(state);
      if (!lists) return;
      deleteCommentFromLists(lists, action.payload);
    });
};
