import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Board, List, Card, ChecklistItem, Label, Attachment } from '../../types';
import * as api from '../../features/boards/api';

interface BoardState {
  currentBoard: Board | null;
  loading: boolean;
  error: string | null;
  // Нове поле: показує, чи активне WebSocket з'єднання для цієї дошки
  isLive: boolean; 
}

const initialState: BoardState = {
  currentBoard: null,
  loading: false,
  error: null,
  isLive: false,
};

const ensureLists = (state: BoardState) => {
  if (!state.currentBoard) return null;
  if (!state.currentBoard.lists) state.currentBoard.lists = [];
  return state.currentBoard.lists;
};

const updateLabelInCards = (lists: List[], updated: Label) => {
  for (const list of lists) {
    for (const card of list.cards || []) {
      if (!card.labels) continue;
      const idx = card.labels.findIndex(l => l.id === updated.id);
      if (idx !== -1) {
        card.labels[idx] = { ...card.labels[idx], ...updated };
      }
    }
  }
};

const removeLabelFromCards = (lists: List[], labelId: number) => {
  for (const list of lists) {
    for (const card of list.cards || []) {
      if (!card.labels) continue;
      card.labels = card.labels.filter(label => label.id !== labelId);
    }
  }
};

const findCardInLists = (lists: List[], cardId: number) => {
  for (const list of lists) {
    const card = list.cards?.find(c => c.id === cardId);
    if (card) return card;
  }
  return null;
};

const findChecklistInCard = (card: Card, checklistId: number) => {
  return card.checklists?.find(c => c.id === checklistId) || null;
};

const removeChecklistFromCard = (card: Card, checklistId: number) => {
  if (!card.checklists) return false;
  const idx = card.checklists.findIndex(checklist => checklist.id === checklistId);
  if (idx === -1) return false;
  card.checklists.splice(idx, 1);
  return true;
};

const removeCardFromLists = (lists: List[], cardId: number) => {
  lists.forEach(list => {
    if (!list.cards) return;
    list.cards = list.cards.filter(c => c.id !== cardId);
  });
};

const upsertCardIntoLists = (lists: List[], card: Card) => {
  removeCardFromLists(lists, card.id);
  const targetList = lists.find(l => l.id === card.list);
  if (!targetList) return;
  if (!targetList.cards) targetList.cards = [];
  targetList.cards.push(card);
  targetList.cards.sort((a, b) => Number(a.order) - Number(b.order));
};

// --- Асинхронні дії (Async Thunks) ---

export const fetchBoardById = createAsyncThunk(
  'board/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await api.getBoardDetails(id);
      if (data.lists) {
        data.lists.sort((a, b) => Number(a.order) - Number(b.order));
        data.lists.forEach(list => {
          if (list.cards) list.cards.sort((a, b) => Number(a.order) - Number(b.order));
        });
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Помилка завантаження дошки');
    }
  }
);

// Board Actions
export const updateBoardAction = createAsyncThunk(
  'board/update',
  async ({ id, data }: { id: number; data: Partial<Board> }) => await api.updateBoard(id, data)
);

export const deleteBoardAction = createAsyncThunk(
  'board/delete',
  async (id: number) => {
    await api.deleteBoard(id);
    return id;
  }
);

export const toggleFavoriteAction = createAsyncThunk(
  'board/toggleFavorite',
  async (id: number) => await api.toggleFavoriteBoard(id)
);

export const removeBoardMemberAction = createAsyncThunk(
  'board/removeMember',
  async (membershipId: number) => {
    await api.removeMember(membershipId);
    return membershipId;
  }
);

export const updateBoardMemberRoleAction = createAsyncThunk(
  'board/updateMemberRole',
  async ({ membershipId, role }: { membershipId: number; role: 'admin' | 'developer' | 'viewer' }) => {
    const updated = await api.updateMemberRole(membershipId, role);
    return updated;
  }
);

// List Actions
export const addListAction = createAsyncThunk(
  'board/addList',
  async ({ boardId, title, order }: { boardId: number; title: string; order: number }) => 
    await api.createList(boardId, title, order)
);

export const updateListAction = createAsyncThunk(
  'board/updateList',
  async ({ listId, data }: { listId: number; data: Partial<List> }) => 
    await api.updateList(listId, data)
);

export const deleteListAction = createAsyncThunk(
  'board/deleteList',
  async (listId: number) => {
    await api.deleteList(listId);
    return listId;
  }
);

export const copyListAction = createAsyncThunk(
  'board/copyList',
  async ({ listId, title }: { listId: number; title?: string }) => await api.copyList(listId, title)
);

export const moveListAction = createAsyncThunk(
  'board/moveList',
  async ({ listId, order }: { listId: number; order: number }) => 
    await api.updateList(listId, { order })
);

// Card Actions
export const addCardAction = createAsyncThunk(
  'board/addCard',
  async ({ listId, title, order }: { listId: number; title: string; order: number }) => 
    await api.createCard(listId, title, order)
);

export const updateCardAction = createAsyncThunk(
  'board/updateCard',
  async ({ cardId, data }: { cardId: number; data: Partial<Card> & { label_ids?: number[] } }) => 
    await api.updateCard(cardId, data)
);

export const deleteCardAction = createAsyncThunk(
  'board/deleteCard',
  async (cardId: number) => {
    await api.deleteCard(cardId);
    return cardId;
  }
);

export const copyCardAction = createAsyncThunk(
  'board/copyCard',
  async ({ cardId, listId, title }: { cardId: number; listId: number; title?: string }) => 
    await api.copyCard(cardId, listId, title)
);

export const moveCardAction = createAsyncThunk(
  'board/moveCard',
  async ({ cardId, listId, order }: { cardId: number; listId: number; order: number }) => 
    await api.updateCard(cardId, { list: listId, order })
);

// Card Details
export const addChecklistAction = createAsyncThunk(
  'board/addChecklist',
  async ({ cardId, title }: { cardId: number; title: string }) => await api.createChecklist(cardId, title)
);

export const deleteChecklistAction = createAsyncThunk(
  'board/deleteChecklist',
  async ({ checklistId }: { checklistId: number; cardId?: number }) => {
    await api.deleteChecklist(checklistId);
    return checklistId;
  }
);

export const addChecklistItemAction = createAsyncThunk(
  'board/addChecklistItem',
  async ({ checklistId, text }: { checklistId: number; text: string }) => await api.createChecklistItem(checklistId, text)
);

export const updateChecklistItemAction = createAsyncThunk(
  'board/updateChecklistItem',
  async ({ itemId, data }: { itemId: number; data: Partial<ChecklistItem> }) => await api.updateChecklistItem(itemId, data)
);

export const deleteChecklistItemAction = createAsyncThunk(
  'board/deleteChecklistItem',
  async ({ itemId }: { itemId: number; checklistId?: number }) => {
    await api.deleteChecklistItem(itemId);
    return itemId;
  }
);

export const addCommentAction = createAsyncThunk(
  'board/addComment',
  async ({ cardId, text }: { cardId: number; text: string }) => await api.createComment(cardId, text)
);

export const updateCommentAction = createAsyncThunk(
  'board/updateComment',
  async ({ commentId, text }: { commentId: number; text: string }) => await api.updateComment(commentId, text)
);

export const deleteCommentAction = createAsyncThunk(
  'board/deleteComment',
  async ({ commentId }: { commentId: number }) => {
    await api.deleteComment(commentId);
    return commentId;
  }
);

export const createLabelAction = createAsyncThunk(
  'board/createLabel',
  async ({ boardId, name, color }: { boardId: number; name: string; color: string }) => await api.createLabel(boardId, name, color)
);

export const updateLabelAction = createAsyncThunk(
  'board/updateLabel',
  async ({ id, data }: { id: number; data: Partial<Label> }) => await api.updateLabel(id, data)
);

export const deleteLabelAction = createAsyncThunk(
  'board/deleteLabel',
  async (labelId: number) => {
    await api.deleteLabel(labelId);
    return labelId;
  }
);

export const joinCardAction = createAsyncThunk(
  'board/joinCard',
  async (cardId: number) => await api.joinCard(cardId)
);

export const leaveCardAction = createAsyncThunk(
  'board/leaveCard',
  async (cardId: number) => await api.leaveCard(cardId)
);

export const removeCardMemberAction = createAsyncThunk(
  'board/removeCardMember',
  async ({ cardId, userId }: { cardId: number; userId: number }) => await api.removeCardMember(cardId, userId)
);

export const addCardMemberAction = createAsyncThunk(
  'board/addCardMember',
  async ({ cardId, userId }: { cardId: number; userId: number }) => await api.addCardMember(cardId, userId)
);

export const addAttachmentAction = createAsyncThunk(
  'board/addAttachment',
  async ({ cardId, file }: { cardId: number; file: File }) => {
    const attachment = await api.createAttachment(cardId, file);
    return { attachment, cardId };
  }
);

export const deleteAttachmentAction = createAsyncThunk(
  'board/deleteAttachment',
  async ({ cardId, attachmentId }: { cardId: number; attachmentId: number }) => {
    await api.deleteAttachment(attachmentId);
    return { cardId, attachmentId };
  }
);

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    // Оновлення стану дошки локально (з WebSocket)
    updateBoardLocally(state, action: PayloadAction<Partial<Board>>) {
      if (state.currentBoard) {
        state.currentBoard = { ...state.currentBoard, ...action.payload };
      }
    },
    // Встановлення статусу WebSocket-з'єднання
    setSocketStatus(state, action: PayloadAction<boolean>) {
      state.isLive = action.payload;
    },
    applySocketUpdate(state, action: PayloadAction<{ actionType: string; payload: any }>) {
      if (!state.currentBoard) return;
      const { actionType, payload } = action.payload;
      const lists = ensureLists(state);

      switch (actionType) {
        case 'board/update/fulfilled': {
          state.currentBoard = { ...state.currentBoard, ...payload };
          return;
        }
        case 'board/addList/fulfilled':
        case 'board/copyList/fulfilled': {
          if (!lists) return;
          const nextList: List = {
            ...payload,
            cards: payload.cards ?? [],
          };
          lists.push(nextList);
          lists.sort((a, b) => Number(a.order) - Number(b.order));
          return;
        }
        case 'board/updateList/fulfilled':
        case 'board/moveList/fulfilled': {
          if (!lists) return;
          const nextList = payload?.list ?? payload;
          const wsMeta = payload?.ws_meta;
          const idx = lists.findIndex(l => l.id === nextList.id);
          if (idx !== -1) lists[idx] = { ...lists[idx], ...nextList };
          if (wsMeta?.destIndex !== undefined && idx !== -1) {
            const [moved] = lists.splice(idx, 1);
            const insertAt = Math.max(0, Math.min(wsMeta.destIndex, lists.length));
            lists.splice(insertAt, 0, moved);
            lists.forEach((l, i) => { l.order = i + 1; });
          }
          return;
        }
        case 'board/deleteList/fulfilled': {
          if (!lists) return;
          state.currentBoard.lists = lists.filter(l => l.id !== payload);
          return;
        }
        case 'board/removeMember/fulfilled': {
          if (!state.currentBoard?.members) return;
          state.currentBoard.members = state.currentBoard.members.filter(m => m.id !== payload);
          return;
        }
        case 'board/updateMemberRole/fulfilled': {
          if (!state.currentBoard?.members) return;
          const idx = state.currentBoard.members.findIndex(m => m.id === payload.id);
          if (idx !== -1) {
            state.currentBoard.members[idx] = { ...state.currentBoard.members[idx], ...payload };
          }
          return;
        }
        case 'board/addCard/fulfilled':
        case 'board/updateCard/fulfilled':
        case 'board/moveCard/fulfilled':
        case 'board/copyCard/fulfilled':
        case 'board/joinCard/fulfilled':
        case 'board/leaveCard/fulfilled':
        case 'board/removeCardMember/fulfilled':
        case 'board/addCardMember/fulfilled': {
          if (!lists) return;
          const nextCard = payload?.card ?? payload;
          const wsMeta = payload?.ws_meta;
          if (wsMeta?.destListId !== undefined && wsMeta?.destIndex !== undefined) {
            removeCardFromLists(lists, nextCard.id);
            const targetList = lists.find(l => l.id === wsMeta.destListId);
            if (!targetList) return;
            if (!targetList.cards) targetList.cards = [];
            const insertAt = Math.max(0, Math.min(wsMeta.destIndex, targetList.cards.length));
            targetList.cards.splice(insertAt, 0, nextCard as Card);
            targetList.cards.forEach((c, i) => { c.order = i + 1; });
          } else {
            upsertCardIntoLists(lists, nextCard as Card);
          }
          return;
        }
        case 'board/deleteCard/fulfilled': {
          if (!lists) return;
          removeCardFromLists(lists, payload);
          return;
        }
        case 'board/createLabel/fulfilled':
        case 'board/updateLabel/fulfilled': {
          if (!state.currentBoard.labels) state.currentBoard.labels = [];
          const idx = state.currentBoard.labels.findIndex(l => l.id === payload.id);
          if (idx === -1) state.currentBoard.labels.push(payload);
          else state.currentBoard.labels[idx] = { ...state.currentBoard.labels[idx], ...payload };
          if (lists) updateLabelInCards(lists, payload as Label);
          return;
        }
        case 'board/deleteLabel/fulfilled': {
          if (!state.currentBoard.labels) return;
          state.currentBoard.labels = state.currentBoard.labels.filter(l => l.id !== payload);
          return;
        }
        case 'board/addChecklist/fulfilled': {
          if (!lists) return;
          const checklist = payload?.checklist ?? payload;
          const wsCardId = payload?.ws_meta?.cardId;
          const targetCardId = wsCardId ?? checklist?.card ?? checklist?.card_id;
          if (!targetCardId) return;
          const card = findCardInLists(lists, targetCardId);
          if (!card) return;
          if (!card.checklists) card.checklists = [];
          if (!card.checklists.some(item => item.id === checklist.id)) {
            card.checklists.push({ ...checklist, items: checklist.items ?? [] });
          }
          return;
        }
        case 'board/deleteChecklist/fulfilled': {
          if (!lists) return;
          const checklistId = payload?.checklistId ?? payload;
          for (const list of lists) {
            for (const card of list.cards || []) {
              if (removeChecklistFromCard(card, checklistId)) return;
            }
          }
          return;
        }
        case 'board/addChecklistItem/fulfilled': {
          if (!lists) return;
          const item = payload?.item ?? payload;
          const checklistId = payload?.ws_meta?.checklistId;
          if (checklistId) {
            for (const list of lists) {
              for (const card of list.cards || []) {
                const checklist = findChecklistInCard(card, checklistId);
                if (checklist) {
                  if (!checklist.items) checklist.items = [];
                  checklist.items.push(item);
                  return;
                }
              }
            }
            return;
          }
          return;
        }
        case 'board/updateChecklistItem/fulfilled': {
          if (!lists) return;
          const updatedItem = payload?.item ?? payload;
          for (const list of lists) {
            for (const card of list.cards || []) {
              for (const checklist of card.checklists || []) {
                const idx = checklist.items?.findIndex(i => i.id === updatedItem.id) ?? -1;
                if (idx !== -1 && checklist.items) {
                  checklist.items[idx] = { ...checklist.items[idx], ...updatedItem };
                  return;
                }
              }
            }
          }
          return;
        }
        case 'board/deleteChecklistItem/fulfilled': {
          if (!lists) return;
          const deletedId = payload?.itemId ?? payload;
          for (const list of lists) {
            for (const card of list.cards || []) {
              for (const checklist of card.checklists || []) {
                if (!checklist.items) continue;
                const idx = checklist.items.findIndex(i => i.id === deletedId);
                if (idx !== -1) {
                  checklist.items.splice(idx, 1);
                  return;
                }
              }
            }
          }
          return;
        }
        case 'board/addComment/fulfilled': {
          if (!lists) return;
          const comment = payload?.comment ?? payload;
          const cardId = payload?.ws_meta?.cardId ?? comment?.card;
          if (!cardId) return;
          const card = findCardInLists(lists, cardId);
          if (!card) return;
          if (!card.comments) card.comments = [];
          card.comments.push(comment);
          return;
        }
        default:
          return;
      }
    },
    updateListOptimistic(state, action: PayloadAction<{ listId: number; data: Partial<List> }>) {
      if (!state.currentBoard?.lists) return;
      const idx = state.currentBoard.lists.findIndex(l => l.id === action.payload.listId);
      if (idx !== -1) {
        state.currentBoard.lists[idx] = { ...state.currentBoard.lists[idx], ...action.payload.data };
      }
    },
    moveListOptimistic(state, action: PayloadAction<{ sourceIndex: number, destIndex: number }>) {
      if (state.currentBoard && state.currentBoard.lists) {
        const newLists = Array.from(state.currentBoard.lists);
        const [removed] = newLists.splice(action.payload.sourceIndex, 1);
        newLists.splice(action.payload.destIndex, 0, removed);
        state.currentBoard.lists = newLists;
      }
    },
    moveCardOptimistic(state, action: PayloadAction<{
      cardId: number, sourceListId: number, destListId: number, newIndex: number 
    }>) {
      if (!state.currentBoard || !state.currentBoard.lists) return;
      const { cardId, sourceListId, destListId, newIndex } = action.payload;
      const sourceList = state.currentBoard.lists.find(l => l.id === sourceListId);
      const destList = state.currentBoard.lists.find(l => l.id === destListId);

      if (sourceList && destList && sourceList.cards) {
        const cardIndex = sourceList.cards.findIndex(c => c.id === cardId);
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
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBoard = action.payload;
      })
      .addCase(fetchBoardById.pending, (state, action) => { 
        state.loading = true; 
        const nextId = action.meta.arg as number;
        if (!state.currentBoard || state.currentBoard.id !== nextId) {
          state.isLive = false; // Скидаємо статус лише при зміні дошки
        }
      })
      .addCase(fetchBoardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBoardAction.fulfilled, (state, action) => {
        if (state.currentBoard) state.currentBoard = { ...state.currentBoard, ...action.payload };
      })
      .addCase(toggleFavoriteAction.fulfilled, (state, action) => {
        if (state.currentBoard) state.currentBoard.is_favorite = action.payload.is_favorite;
      })
      .addCase(addListAction.fulfilled, (state, action) => {
        state.currentBoard?.lists?.push({ ...action.payload, cards: [] });
      })
      .addCase(updateListAction.fulfilled, (state, action) => {
        if (!state.currentBoard?.lists) return;
        const idx = state.currentBoard.lists.findIndex(l => l.id === action.payload.id);
        if (idx !== -1) {
          state.currentBoard.lists[idx] = { ...state.currentBoard.lists[idx], ...action.payload };
        }
      })
      .addCase(deleteListAction.fulfilled, (state, action) => {
        if (state.currentBoard) {
            state.currentBoard.lists = state.currentBoard.lists?.filter(l => l.id !== action.payload);
        }
      })
      .addCase(removeBoardMemberAction.fulfilled, (state, action) => {
        if (!state.currentBoard?.members) return;
        state.currentBoard.members = state.currentBoard.members.filter(m => m.id !== action.payload);
      })
      .addCase(updateBoardMemberRoleAction.fulfilled, (state, action) => {
        if (!state.currentBoard?.members) return;
        const idx = state.currentBoard.members.findIndex(m => m.id === action.payload.id);
        if (idx !== -1) {
          state.currentBoard.members[idx] = { ...state.currentBoard.members[idx], ...action.payload };
        }
      })
      .addCase(copyListAction.fulfilled, (state, action) => {
          state.currentBoard?.lists?.push(action.payload);
      })
      .addCase(addCardAction.fulfilled, (state, action) => {
        const list = state.currentBoard?.lists?.find(l => l.id === action.payload.list);
        if (list) {
            if (!list.cards) list.cards = [];
            list.cards.push(action.payload);
        }
      })
      .addCase(copyCardAction.fulfilled, (state, action) => {
        const list = state.currentBoard?.lists?.find(l => l.id === action.payload.list);
        if (list) {
          if (!list.cards) list.cards = [];
          list.cards.push(action.payload);
        }
      })
      .addCase(updateCardAction.fulfilled, (state, action) => {
        state.currentBoard?.lists?.forEach(l => {
          const idx = l.cards?.findIndex(c => c.id === action.payload.id);
          if (idx !== undefined && idx !== -1 && l.cards) l.cards[idx] = action.payload;
        });
      })
      .addCase(deleteCardAction.fulfilled, (state, action) => {
        state.currentBoard?.lists?.forEach(l => {
          if (l.cards) l.cards = l.cards.filter(c => c.id !== action.payload);
        });
      })
      .addCase(createLabelAction.fulfilled, (state, action) => {
        state.currentBoard?.labels?.push(action.payload);
        const lists = ensureLists(state);
        if (lists) updateLabelInCards(lists, action.payload);
      })
      .addCase(updateLabelAction.fulfilled, (state, action) => {
        if (state.currentBoard?.labels) {
          const idx = state.currentBoard.labels.findIndex(l => l.id === action.payload.id);
          if (idx !== -1) state.currentBoard.labels[idx] = { ...state.currentBoard.labels[idx], ...action.payload };
        }
        const lists = ensureLists(state);
        if (lists) updateLabelInCards(lists, action.payload);
      })
      .addCase(deleteLabelAction.fulfilled, (state, action) => {
        if (state.currentBoard) {
          state.currentBoard.labels = state.currentBoard.labels?.filter(label => label.id !== action.payload);
        }
        const lists = ensureLists(state);
        if (lists) removeLabelFromCards(lists, action.payload);
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
      .addCase(addAttachmentAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const { attachment, cardId } = action.payload as { attachment: Attachment; cardId: number };
        const card = findCardInLists(lists, cardId);
        if (!card) return;
        if (!card.attachments) card.attachments = [];
        card.attachments.push(attachment);
      })
      .addCase(deleteAttachmentAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const { cardId, attachmentId } = action.payload as { cardId: number; attachmentId: number };
        const card = findCardInLists(lists, cardId);
        if (!card?.attachments) return;
        card.attachments = card.attachments.filter(att => att.id !== attachmentId);
      })
      .addCase(addChecklistAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const cardId = action.meta.arg.cardId;
        const card = findCardInLists(lists, cardId);
        if (!card) return;
        if (!card.checklists) card.checklists = [];
        if (!card.checklists.some(checklist => checklist.id === action.payload.id)) {
          card.checklists.push({ ...action.payload, items: action.payload.items ?? [] });
        }
      })
      .addCase(deleteChecklistAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const checklistId = action.payload;
        for (const list of lists) {
          for (const card of list.cards || []) {
            if (removeChecklistFromCard(card, checklistId)) {
              return;
            }
          }
        }
      })
      .addCase(addChecklistItemAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const checklistId = action.meta.arg.checklistId;
        for (const list of lists) {
          for (const card of list.cards || []) {
            const checklist = findChecklistInCard(card, checklistId);
            if (checklist) {
              if (!checklist.items) checklist.items = [];
              checklist.items.push(action.payload);
              return;
            }
          }
        }
      })
      .addCase(updateChecklistItemAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const updatedItem = action.payload;
        for (const list of lists) {
          for (const card of list.cards || []) {
            for (const checklist of card.checklists || []) {
              const idx = checklist.items?.findIndex(i => i.id === updatedItem.id) ?? -1;
              if (idx !== -1 && checklist.items) {
                checklist.items[idx] = { ...checklist.items[idx], ...updatedItem };
                return;
              }
            }
          }
        }
      })
      .addCase(deleteChecklistItemAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const deletedId = action.payload;
        for (const list of lists) {
          for (const card of list.cards || []) {
            for (const checklist of card.checklists || []) {
              if (!checklist.items) continue;
              const idx = checklist.items.findIndex(i => i.id === deletedId);
              if (idx !== -1) {
                checklist.items.splice(idx, 1);
                return;
              }
            }
          }
        }
      })
      .addCase(addCommentAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const cardId = action.meta.arg.cardId;
        const card = findCardInLists(lists, cardId);
        if (!card) return;
        if (!card.comments) card.comments = [];
        card.comments.push(action.payload);
      })
      .addCase(updateCommentAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const updated = action.payload;
        const card = lists
          .flatMap(list => list.cards || [])
          .find(c => c.comments?.some(comment => comment.id === updated.id));
        if (!card || !card.comments) return;
        const idx = card.comments.findIndex(comment => comment.id === updated.id);
        if (idx !== -1) {
          card.comments[idx] = { ...card.comments[idx], ...updated };
        }
      })
      .addCase(deleteCommentAction.fulfilled, (state, action) => {
        const lists = ensureLists(state);
        if (!lists) return;
        const deletedId = action.payload;
        for (const list of lists) {
          for (const card of list.cards || []) {
            if (!card.comments) continue;
            const idx = card.comments.findIndex(comment => comment.id === deletedId);
            if (idx !== -1) {
              card.comments.splice(idx, 1);
              return;
            }
          }
        }
      })
      .addMatcher(
        (action) => action.type.endsWith('Card/fulfilled'),
        (state, action: PayloadAction<any>) => {
          const updatedCard = action.payload as Card;
          if (updatedCard && updatedCard.id) {
            state.currentBoard?.lists?.forEach(l => {
              const idx = l.cards?.findIndex(c => c.id === updatedCard.id);
              if (idx !== undefined && idx !== -1 && l.cards) l.cards[idx] = updatedCard;
            });
          }
        }
      );
  }
});

export const { updateBoardLocally, setSocketStatus, applySocketUpdate, updateListOptimistic, moveCardOptimistic, moveListOptimistic, clearCurrentBoard } = boardSlice.actions;
export default boardSlice.reducer;
