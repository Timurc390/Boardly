import { useState, useEffect, useCallback } from 'react';
import { Board, List, Card, Checklist, ChecklistItem, Label, Comment } from '../../../types';
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

  const addChecklist = async (cardId: number, title: string) => {
    try { await api.createChecklist(cardId, title); fetchBoard(); } catch (e) { console.error(e); }
  };

  const addChecklistItem = async (checklistId: number, text: string) => {
    try { await api.createChecklistItem(checklistId, text); fetchBoard(); } catch (e) { console.error(e); }
  };

  const toggleChecklistItem = async (itemId: number, isChecked: boolean) => {
    try { await api.updateChecklistItem(itemId, { is_checked: isChecked }); fetchBoard(); } catch (e) { console.error(e); }
  };

  const addComment = async (cardId: number, text: string) => {
    try { await api.createComment(cardId, text); fetchBoard(); } catch (e) { console.error(e); }
  };

  const updateCardLabels = async (cardId: number, labelIds: number[]) => {
    try { await api.updateCard(cardId, { label_ids: labelIds }); fetchBoard(); } catch (e) { console.error(e); }
  };

  const createLabel = async (name: string, color: string) => {
    if (!board) return;
    try { await api.createLabel(board.id, name, color); fetchBoard(); } catch (e) { console.error(e); }
  };

  const updateLabelData = async (labelId: number, name: string, color: string) => {
    try { await api.updateLabel(labelId, { name, color }); fetchBoard(); } catch (e) { console.error(e); }
  };

  const deleteLabelData = async (labelId: number) => {
    if (!window.confirm('Видалити цю мітку? Вона зникне з усіх карток.')) return;
    try { await api.deleteLabel(labelId); fetchBoard(); } catch (e) { console.error(e); }
  };

  const updateBoardData = async (data: Partial<Board>) => {
    if (!board) return;
    setBoard(prev => prev ? { ...prev, ...data } : null);
    try { await api.updateBoard(board.id, data); } catch (e) { fetchBoard(); }
  };
  const deleteBoardData = async () => {
    if (!board) return;
    await api.deleteBoard(board.id);
  };
  const toggleFavorite = async () => {
    if (!board) return;
    const oldStatus = board.is_favorite;
    setBoard(prev => prev ? { ...prev, is_favorite: !oldStatus } : null);
    try { await api.toggleFavoriteBoard(board.id); } 
    catch (e) { setBoard(prev => prev ? { ...prev, is_favorite: oldStatus } : null); }
  };
  const archiveBoard = async () => {
    if (!board) return;
    updateBoardData({ is_archived: !board.is_archived });
  };
  const removeMemberFromBoard = async (membershipId: number) => {
    if (!board) return;
    setBoard(prev => prev ? { ...prev, members: prev.members?.filter(m => m.id !== membershipId) } : null);
    try { await api.removeMember(membershipId); } catch (e) { fetchBoard(); }
  };

  const addList = async (title: string) => {
    if (!board) return;
    const order = board.lists ? board.lists.length + 1 : 1;
    const newList = await api.createList(board.id, title, order);
    setBoard(prev => prev ? { ...prev, lists: [...(prev.lists || []), { ...newList, cards: [] }] } : null);
  };
  const updateListData = async (listId: number, data: Partial<List>) => {
    if (!board) return;
    setBoard(prev => prev ? {
      ...prev,
      lists: prev.lists?.map(l => l.id === listId ? { ...l, ...data } : l)
    } : null);
    try { await api.updateList(listId, data); } catch (e) { fetchBoard(); }
  };
  const deleteListData = async (listId: number) => {
    if (!board) return;
    setBoard(prev => prev ? { ...prev, lists: prev.lists?.filter(l => l.id !== listId) } : null);
    try { await api.deleteList(listId); } catch (e) { fetchBoard(); }
  };
  const copyListData = async (listId: number) => {
    if (!board) return;
    try {
      const copiedList = await api.copyList(listId);
      setBoard(prev => prev ? { ...prev, lists: [...(prev.lists || []), copiedList] } : null);
    } catch (e) { console.error(e); }
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
  const updateCardData = async (cardId: number, listId: number, data: Partial<Card>) => {
    if (!board) return;
    setBoard(prev => {
      if (!prev || !prev.lists) return prev;
      return {
        ...prev,
        lists: prev.lists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              cards: l.cards?.map(c => c.id === cardId ? { ...c, ...data } : c) || []
            };
          }
          return l;
        })
      };
    });
    try { await api.updateCard(cardId, data); fetchBoard(); } catch (e) { fetchBoard(); }
  };
  const deleteCardData = async (cardId: number, listId: number) => {
    if (!board) return;
    setBoard(prev => {
      if (!prev || !prev.lists) return prev;
      return {
        ...prev,
        lists: prev.lists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              cards: l.cards?.filter(c => c.id !== cardId) || []
            };
          }
          return l;
        })
      };
    });
    try { await api.deleteCard(cardId); } catch (e) { fetchBoard(); }
  };
  const copyCardData = async (cardId: number, listId: number, title?: string) => {
    if (!board) return;
    try {
      const newCard = await api.copyCard(cardId, listId, title);
      setBoard(prev => {
        if (!prev || !prev.lists) return prev;
        return {
          ...prev,
          lists: prev.lists.map(l => 
            l.id === listId 
              ? { ...l, cards: [...(l.cards || []), newCard] } 
              : l
          )
        };
      });
    } catch (e) { console.error(e); }
  };

  const joinCardMember = async (cardId: number) => {
    try {
      const updatedCard = await api.joinCard(cardId);
      setBoard(prev => {
        if (!prev || !prev.lists) return prev;
        return {
          ...prev,
          lists: prev.lists.map(l => {
            const cardIndex = l.cards?.findIndex(c => c.id === cardId);
            if (cardIndex !== undefined && cardIndex !== -1 && l.cards) {
               const newCards = [...l.cards];
               newCards[cardIndex] = updatedCard;
               return { ...l, cards: newCards };
            }
            return l;
          })
        };
      });
    } catch (e) { console.error(e); alert("Не вдалося приєднатися"); }
  };

  const leaveCardMember = async (cardId: number) => {
    try {
      const updatedCard = await api.leaveCard(cardId);
      setBoard(prev => {
        if (!prev || !prev.lists) return prev;
        return {
          ...prev,
          lists: prev.lists.map(l => {
            const cardIndex = l.cards?.findIndex(c => c.id === cardId);
            if (cardIndex !== undefined && cardIndex !== -1 && l.cards) {
               const newCards = [...l.cards];
               newCards[cardIndex] = updatedCard;
               return { ...l, cards: newCards };
            }
            return l;
          })
        };
      });
    } catch (e) { console.error(e); }
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
    board, isLoading, error, fetchBoard,
    updateBoardData, deleteBoardData, toggleFavorite, archiveBoard, removeMemberFromBoard,
    addList, updateListData, deleteListData, copyListData,
    addCard, updateCardData, deleteCardData, copyCardData,
    addChecklist, addChecklistItem, toggleChecklistItem, addComment, updateCardLabels, createLabel,
    updateLabelData, deleteLabelData,
    joinCardMember, leaveCardMember, 
    onDragEnd
  };
};
