import { useState, useEffect, useCallback } from 'react';
import { Board, List, Card } from '../../../types';
import * as api from '../api';
import { DropResult } from '@hello-pangea/dnd';

export const useBoardDetail = (boardId: number) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getBoardDetails(boardId);
      if (data.lists) {
        data.lists.sort((a, b) => a.order - b.order);
        data.lists.forEach(list => {
          if (list.cards) list.cards.sort((a, b) => a.order - b.order);
        });
      }
      setBoard(data);
    } catch (err) {
      setError('Failed to fetch board details');
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // --- Board Actions ---
  const updateBoardData = async (data: Partial<Board>) => {
    if (!board) return;
    setBoard(prev => prev ? { ...prev, ...data } : null);
    try {
        await api.updateBoard(board.id, data);
    } catch (e) {
        fetchBoard();
    }
  };

  const deleteBoardData = async () => {
    if (!board) return;
    await api.deleteBoard(board.id);
  };

  // ВИПРАВЛЕНО: Використовуємо правильний endpoint для обраного
  const toggleFavorite = async () => {
      if (!board) return;
      
      // Оптимістичне оновлення інтерфейсу
      const oldStatus = board.is_favorite;
      setBoard(prev => prev ? { ...prev, is_favorite: !oldStatus } : null);

      try {
          // Виклик API
          await api.toggleFavoriteBoard(board.id);
      } catch (e) {
          // Відкат у разі помилки
          console.error("Failed to toggle favorite", e);
          setBoard(prev => prev ? { ...prev, is_favorite: oldStatus } : null);
      }
  };

  const archiveBoard = async () => {
      if (!board) return;
      const newValue = !board.is_archived;
      updateBoardData({ is_archived: newValue });
  };

  const removeMemberFromBoard = async (membershipId: number) => {
      if (!board) return;
      setBoard(prev => {
          if (!prev || !prev.members) return prev;
          return {
              ...prev,
              members: prev.members.filter(m => m.id !== membershipId)
          };
      });
      try {
          await api.removeMember(membershipId);
      } catch (e) {
          fetchBoard();
      }
  };

  // --- List/Card Actions ---
  const updateListData = async (listId: number, data: Partial<List>) => {
    if (!board) return;
    setBoard(prev => {
      if (!prev || !prev.lists) return prev;
      return {
        ...prev,
        lists: prev.lists.map(l => l.id === listId ? { ...l, ...data } : l)
      };
    });
    try { await api.updateList(listId, data); } catch (e) { fetchBoard(); }
  };

  const deleteListData = async (listId: number) => {
    if (!board) return;
    setBoard(prev => {
      if (!prev || !prev.lists) return prev;
      return { ...prev, lists: prev.lists.filter(l => l.id !== listId) };
    });
    try { await api.deleteList(listId); } catch (e) { fetchBoard(); }
  };

  const addList = async (title: string) => {
    if (!board) return;
    const order = board.lists ? board.lists.length + 1 : 1;
    // ТУТ БЕЗ try/catch, щоб помилка пішла в компонент для обробки
    const newList = await api.createList(board.id, title, order);
    
    setBoard(prev => {
      if (!prev) return null;
      return { ...prev, lists: [...(prev.lists || []), { ...newList, cards: [] }] };
    });
  };

  const addCard = async (listId: number, title: string) => {
    if (!board) return;
    const list = board.lists?.find(l => l.id === listId);
    const order = list?.cards ? list.cards.length + 1 : 1;
    const newCard = await api.createCard(listId, title, order);
    setBoard(prev => {
      if (!prev || !prev.lists) return prev;
      return {
        ...prev,
        lists: prev.lists.map(l => l.id === listId ? { ...l, cards: [...(l.cards || []), newCard] } : l)
      };
    });
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;
    if (!destination || !board || !board.lists) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'list') {
      const newLists = Array.from(board.lists);
      const [removed] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, removed);
      setBoard({ ...board, lists: newLists });
      try { await api.updateList(removed.id, { order: destination.index + 1 }); } catch (error) { fetchBoard(); }
      return;
    }

    const parseListId = (dropId: string) => parseInt(dropId.replace('list-', ''), 10);
    const sourceListId = parseListId(source.droppableId);
    const destListId = parseListId(destination.droppableId);
    const sourceList = board.lists.find(l => l.id === sourceListId);
    const destList = board.lists.find(l => l.id === destListId);

    if (!sourceList || !destList) return;

    const sourceCards = Array.from(sourceList.cards || []);
    const destCards = sourceList === destList ? sourceCards : Array.from(destList.cards || []);
    const [movedCard] = sourceCards.splice(source.index, 1);
    destCards.splice(destination.index, 0, movedCard);

    const newLists = board.lists.map(l => {
      if (l.id === sourceList.id) return { ...l, cards: sourceCards };
      if (l.id === destList.id) return { ...l, cards: destCards };
      return l;
    });

    setBoard({ ...board, lists: newLists });
    try { await api.updateCard(movedCard.id, { list: destList.id, order: destination.index + 1 }); } catch (error) { fetchBoard(); }
  };

  return { 
    board, isLoading, error, 
    addList, addCard, onDragEnd, fetchBoard,
    updateBoardData, deleteBoardData,
    updateListData, deleteListData,
    toggleFavorite, archiveBoard, removeMemberFromBoard
  };
};