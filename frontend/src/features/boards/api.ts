import client from '../../api/client';
import { Board, List, Card } from '../../types';

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

// --- НОВИЙ МЕТОД ДЛЯ ОБРАНОГО ---
export const toggleFavoriteBoard = async (id: number): Promise<{ status: string, is_favorite: boolean }> => {
  // Викликаємо спеціальний action endpoint, а не patch
  const res = await client.post(`/boards/${id}/favorite/`);
  return res.data;
};

// --- Members & Invites ---
export const removeMember = async (membershipId: number): Promise<void> => {
  await client.delete(`/board-members/${membershipId}/`);
};

export const joinBoard = async (inviteLink: string): Promise<Board> => {
  const res = await client.post('/boards/join/', { invite_link: inviteLink });
  return res.data;
};

// --- Lists ---
export const createList = async (boardId: number, title: string, order: number): Promise<List> => {
  // Використовуємо 'board' як очікує бекенд
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

// --- Cards ---
export const createCard = async (listId: number, title: string, order: number): Promise<Card> => {
  const res = await client.post('/cards/', { list: listId, title, order });
  return res.data;
};

export const updateCard = async (id: number, data: Partial<Card>): Promise<Card> => {
  const payload: any = { ...data };
  if (data.list) payload.list = data.list;
  
  const res = await client.patch(`/cards/${id}/`, payload);
  return res.data;
};

export const deleteCard = async (id: number): Promise<void> => {
  await client.delete(`/cards/${id}/`);
};