import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Board, List } from '../../types';
import { BoardRealtimeActionType } from '../realtime/boardRealtimeActions';
import { buildBoardExtraReducers } from './board/extraReducers';
import { reorderActiveListsById } from './board/helpers';
import { applySocketUpdateReducer } from './board/socketReducers';
import { initialBoardState } from './board/types';

export {
  fetchBoardsAction,
  createBoardAction,
  fetchBoardById,
  updateBoardAction,
  deleteBoardAction,
  toggleFavoriteAction,
  removeBoardMemberAction,
  updateBoardMemberRoleAction,
  addListAction,
  updateListAction,
  deleteListAction,
  copyListAction,
  moveListAction,
  addCardAction,
  updateCardAction,
  deleteCardAction,
  copyCardAction,
  moveCardAction,
  addChecklistAction,
  deleteChecklistAction,
  addChecklistItemAction,
  updateChecklistItemAction,
  deleteChecklistItemAction,
  addCommentAction,
  updateCommentAction,
  deleteCommentAction,
  createLabelAction,
  updateLabelAction,
  deleteLabelAction,
  joinCardAction,
  leaveCardAction,
  removeCardMemberAction,
  addCardMemberAction,
  addAttachmentAction,
  deleteAttachmentAction,
} from './board/thunks';

const boardSlice = createSlice({
  name: 'board',
  initialState: initialBoardState,
  reducers: {
    updateBoardLocally(state, action: PayloadAction<Partial<Board>>) {
      if (state.currentBoard) {
        state.currentBoard = { ...state.currentBoard, ...action.payload };
      }
    },
    setSocketStatus(state, action: PayloadAction<boolean>) {
      state.isLive = action.payload;
    },
    applySocketUpdate(state, action: PayloadAction<{ actionType: BoardRealtimeActionType; payload: unknown }>) {
      applySocketUpdateReducer(state, action.payload);
    },
    updateListOptimistic(state, action: PayloadAction<{ listId: number; data: Partial<List> }>) {
      if (!state.currentBoard?.lists) return;
      const idx = state.currentBoard.lists.findIndex((list) => list.id === action.payload.listId);
      if (idx !== -1) {
        state.currentBoard.lists[idx] = { ...state.currentBoard.lists[idx], ...action.payload.data };
      }
    },
    moveListOptimistic(state, action: PayloadAction<{ listId: number; destIndex: number }>) {
      if (state.currentBoard && state.currentBoard.lists) {
        reorderActiveListsById(state.currentBoard.lists, action.payload.listId, action.payload.destIndex);
      }
    },
    moveCardOptimistic(
      state,
      action: PayloadAction<{ cardId: number; sourceListId: number; destListId: number; newIndex: number }>
    ) {
      if (!state.currentBoard || !state.currentBoard.lists) return;
      const { cardId, sourceListId, destListId, newIndex } = action.payload;
      const sourceList = state.currentBoard.lists.find((list) => list.id === sourceListId);
      const destList = state.currentBoard.lists.find((list) => list.id === destListId);

      if (sourceList && destList && sourceList.cards) {
        const cardIndex = sourceList.cards.findIndex((card) => card.id === cardId);
        if (cardIndex !== -1) {
          const [movedCard] = sourceList.cards.splice(cardIndex, 1);
          movedCard.list = destListId;
          if (!destList.cards) destList.cards = [];
          destList.cards.splice(newIndex, 0, movedCard);
        }
      }
    },
    clearCurrentBoard(state) {
      state.currentBoard = null;
      state.error = null;
      state.isLive = false;
      state.activeBoardFetchRequestId = null;
    },
  },
  extraReducers: (builder) => {
    buildBoardExtraReducers(builder);
  },
});

export const {
  updateBoardLocally,
  setSocketStatus,
  applySocketUpdate,
  updateListOptimistic,
  moveCardOptimistic,
  moveListOptimistic,
  clearCurrentBoard,
} = boardSlice.actions;

export default boardSlice.reducer;
