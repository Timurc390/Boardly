import client from '../../api/client';
import { type ActivityLog, type Attachment, type Board, type Card, type Checklist, type ChecklistItem, type Comment, type Label, type List } from '../../types';

type BoardMember = NonNullable<Board['members']>[number];

export const getBoards = async (): Promise<Board[]> => {
  const res = await client.get('/boards/');
  return res.data;
};

export const createBoard = async (title: string): Promise<Board> => {
  const res = await client.post('/boards/', { title });
  return res.data;
};

export const getBoardDetails = async (id: number): Promise<Board> => {
  const res = await client.get(`/boards/${id}/`);
  return res.data;
};

export const updateBoard = async (id: number, data: Partial<Board>): Promise<Board> => {
  const res = await client.patch(`/boards/${id}/`, data);
  return res.data;
};

export const deleteBoard = async (id: number): Promise<void> => {
  await client.delete(`/boards/${id}/`);
};

export const toggleFavoriteBoard = async (id: number): Promise<{ status: string, is_favorite: boolean }> => {
  const res = await client.post(`/boards/${id}/favorite/`);
  return res.data;
};

export const removeMember = async (membershipId: number): Promise<void> => {
  await client.delete(`/board-members/${membershipId}/`);
};

export const updateMemberRole = async (
  membershipId: number,
  role: 'admin' | 'developer' | 'viewer'
): Promise<BoardMember> => {
  const res = await client.patch(`/board-members/${membershipId}/`, { role });
  return res.data;
};

export const joinBoard = async (inviteLink: string): Promise<Board> => {
  const res = await client.post('/boards/join/', { invite_link: inviteLink });
  return res.data;
};

export const createList = async (boardId: number, title: string, order: number): Promise<List> => {
  const res = await client.post('/lists/', { board: boardId, title, order });
  return res.data;
};

export const updateList = async (id: number, data: Partial<List>): Promise<List> => {
  const res = await client.patch(`/lists/${id}/`, data);
  return res.data;
};

export const deleteList = async (id: number): Promise<void> => {
  await client.delete(`/lists/${id}/`);
};

export const copyList = async (listId: number, title?: string): Promise<List> => {
  const res = await client.post(`/lists/${listId}/copy/`, { title });
  return res.data;
};

export const createCard = async (listId: number, title: string, order: number): Promise<Card> => {
  const res = await client.post('/cards/', { list: listId, title, order });
  return res.data;
};

export const updateCard = async (id: number, data: Partial<Card> & { label_ids?: number[] }): Promise<Card> => {
  const payload: Partial<Card> & { label_ids?: number[]; list?: number } = { ...data };
  if (data.list) payload.list = data.list;
  const res = await client.patch(`/cards/${id}/`, payload);
  return res.data;
};

export const deleteCard = async (id: number): Promise<void> => {
  await client.delete(`/cards/${id}/`);
};

export const copyCard = async (cardId: number, listId: number, title?: string): Promise<Card> => {
  const res = await client.post(`/cards/${cardId}/copy/`, { list_id: listId, title });
  return res.data;
};

export const joinCard = async (cardId: number): Promise<Card> => {
  const res = await client.post(`/cards/${cardId}/join/`);
  return res.data;
};

export const leaveCard = async (cardId: number): Promise<Card> => {
  const res = await client.post(`/cards/${cardId}/leave/`);
  return res.data;
};

export const removeCardMember = async (cardId: number, userId: number): Promise<Card> => {
  const res = await client.post(`/cards/${cardId}/remove-member/`, { user_id: userId });
  return res.data;
};

export const addCardMember = async (cardId: number, userId: number): Promise<Card> => {
  const res = await client.post(`/cards/${cardId}/add-member/`, { user_id: userId });
  return res.data;
};

export const toggleCardPublic = async (cardId: number): Promise<Card> => {
  const res = await client.post(`/cards/${cardId}/toggle_public/`);
  return res.data;
};

export const createChecklist = async (cardId: number, title: string): Promise<Checklist> => {
  const res = await client.post('/checklists/', { card: cardId, title });
  return res.data;
};

export const deleteChecklist = async (checklistId: number): Promise<void> => {
  await client.delete(`/checklists/${checklistId}/`);
};

export const createChecklistItem = async (checklistId: number, text: string): Promise<ChecklistItem> => {
  const res = await client.post('/checklist-items/', { checklist: checklistId, text });
  return res.data;
};

export const updateChecklistItem = async (itemId: number, data: Partial<ChecklistItem>): Promise<ChecklistItem> => {
  const res = await client.patch(`/checklist-items/${itemId}/`, data);
  return res.data;
};

export const deleteChecklistItem = async (itemId: number): Promise<void> => {
  await client.delete(`/checklist-items/${itemId}/`);
};

export const createComment = async (cardId: number, text: string): Promise<Comment> => {
  const res = await client.post('/comments/', { card: cardId, text });
  return res.data;
};

export const updateComment = async (commentId: number, text: string): Promise<Comment> => {
  const res = await client.patch(`/comments/${commentId}/`, { text });
  return res.data;
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await client.delete(`/comments/${commentId}/`);
};

export const createAttachment = async (cardId: number, file: File): Promise<Attachment> => {
  const formData = new FormData();
  formData.append('card', String(cardId));
  formData.append('file', file);
  const res = await client.post('/attachments/', formData);
  return res.data;
};

export const deleteAttachment = async (attachmentId: number): Promise<void> => {
  await client.delete(`/attachments/${attachmentId}/`);
};

export const createLabel = async (boardId: number, name: string, color: string): Promise<Label> => {
  const res = await client.post('/labels/', { board: boardId, name, color });
  return res.data;
};

export const updateLabel = async (labelId: number, data: Partial<Label>): Promise<Label> => {
  const res = await client.patch(`/labels/${labelId}/`, data);
  return res.data;
};

export const deleteLabel = async (labelId: number): Promise<void> => {
  await client.delete(`/labels/${labelId}/`);
};

export const getBoardActivity = async (boardId: number, userId?: number): Promise<ActivityLog[]> => {
  const res = await client.get('/activity/', { params: { board_id: boardId, user_id: userId } });
  return res.data;
};
