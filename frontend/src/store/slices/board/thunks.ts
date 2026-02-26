import { createAsyncThunk } from '@reduxjs/toolkit';
import { Attachment, Board, Card, ChecklistItem, Label, List } from '../../../types';
import * as api from '../../../features/boards/api';
import { extractApiErrorDetail } from '../../../shared/utils/apiError';

type BoardThunkConfig = {
  rejectValue: string;
};

export const fetchBoardsAction = createAsyncThunk<Board[], void, BoardThunkConfig>(
  'board/fetchBoards',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getBoards();
    } catch (err: unknown) {
      return rejectWithValue(extractApiErrorDetail(err, 'Помилка завантаження дощок'));
    }
  }
);

export const createBoardAction = createAsyncThunk<Board, string, BoardThunkConfig>(
  'board/createBoard',
  async (title: string, { rejectWithValue }) => {
    try {
      return await api.createBoard(title);
    } catch (err: unknown) {
      return rejectWithValue(extractApiErrorDetail(err, 'Помилка створення дошки'));
    }
  }
);

export const fetchBoardById = createAsyncThunk<Board, number, BoardThunkConfig>(
  'board/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await api.getBoardDetails(id);
      if (data.lists) {
        data.lists.sort((a, b) => Number(a.order) - Number(b.order));
        data.lists.forEach((list) => {
          if (list.cards) list.cards.sort((a, b) => Number(a.order) - Number(b.order));
        });
      }
      return data;
    } catch (err: unknown) {
      return rejectWithValue(extractApiErrorDetail(err, 'Помилка завантаження дошки'));
    }
  }
);

export const updateBoardAction = createAsyncThunk(
  'board/update',
  async ({ id, data }: { id: number; data: Partial<Board> }) => await api.updateBoard(id, data)
);

export const deleteBoardAction = createAsyncThunk('board/delete', async (id: number) => {
  await api.deleteBoard(id);
  return id;
});

export const toggleFavoriteAction = createAsyncThunk(
  'board/toggleFavorite',
  async (id: number) => await api.toggleFavoriteBoard(id)
);

export const removeBoardMemberAction = createAsyncThunk('board/removeMember', async (membershipId: number) => {
  await api.removeMember(membershipId);
  return membershipId;
});

export const updateBoardMemberRoleAction = createAsyncThunk(
  'board/updateMemberRole',
  async ({ membershipId, role }: { membershipId: number; role: 'admin' | 'developer' | 'viewer' }) => {
    const updated = await api.updateMemberRole(membershipId, role);
    return updated;
  }
);

export const addListAction = createAsyncThunk(
  'board/addList',
  async ({ boardId, title, order }: { boardId: number; title: string; order: number }) =>
    await api.createList(boardId, title, order)
);

export const updateListAction = createAsyncThunk(
  'board/updateList',
  async ({ listId, data }: { listId: number; data: Partial<List> }) => await api.updateList(listId, data)
);

export const deleteListAction = createAsyncThunk('board/deleteList', async (listId: number) => {
  await api.deleteList(listId);
  return listId;
});

export const copyListAction = createAsyncThunk(
  'board/copyList',
  async ({ listId, title }: { listId: number; title?: string }) => await api.copyList(listId, title)
);

export const moveListAction = createAsyncThunk(
  'board/moveList',
  async ({ listId, order }: { listId: number; order: number }) => await api.updateList(listId, { order })
);

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

export const deleteCardAction = createAsyncThunk('board/deleteCard', async (cardId: number) => {
  await api.deleteCard(cardId);
  return cardId;
});

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
  async ({ checklistId, text }: { checklistId: number; text: string }) =>
    await api.createChecklistItem(checklistId, text)
);

export const updateChecklistItemAction = createAsyncThunk(
  'board/updateChecklistItem',
  async ({ itemId, data }: { itemId: number; data: Partial<ChecklistItem> }) =>
    await api.updateChecklistItem(itemId, data)
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

export const deleteCommentAction = createAsyncThunk('board/deleteComment', async ({ commentId }: { commentId: number }) => {
  await api.deleteComment(commentId);
  return commentId;
});

export const createLabelAction = createAsyncThunk(
  'board/createLabel',
  async ({ boardId, name, color }: { boardId: number; name: string; color: string }) =>
    await api.createLabel(boardId, name, color)
);

export const updateLabelAction = createAsyncThunk(
  'board/updateLabel',
  async ({ id, data }: { id: number; data: Partial<Label> }) => await api.updateLabel(id, data)
);

export const deleteLabelAction = createAsyncThunk('board/deleteLabel', async (labelId: number) => {
  await api.deleteLabel(labelId);
  return labelId;
});

export const joinCardAction = createAsyncThunk('board/joinCard', async (cardId: number) => await api.joinCard(cardId));

export const leaveCardAction = createAsyncThunk('board/leaveCard', async (cardId: number) => await api.leaveCard(cardId));

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
    return { attachment, cardId } as { attachment: Attachment; cardId: number };
  }
);

export const deleteAttachmentAction = createAsyncThunk(
  'board/deleteAttachment',
  async ({ cardId, attachmentId }: { cardId: number; attachmentId: number }) => {
    await api.deleteAttachment(attachmentId);
    return { cardId, attachmentId };
  }
);
