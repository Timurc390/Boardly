import { Card, Label, List } from '../../../types';
import { BoardState } from './types';

export const ensureLists = (state: BoardState) => {
  if (!state.currentBoard) return null;
  if (!state.currentBoard.lists) state.currentBoard.lists = [];
  return state.currentBoard.lists;
};

export const updateLabelInCards = (lists: List[], updated: Label) => {
  for (const list of lists) {
    for (const card of list.cards || []) {
      if (!card.labels) continue;
      const idx = card.labels.findIndex((l) => l.id === updated.id);
      if (idx !== -1) {
        card.labels[idx] = { ...card.labels[idx], ...updated };
      }
    }
  }
};

export const removeLabelFromCards = (lists: List[], labelId: number) => {
  for (const list of lists) {
    for (const card of list.cards || []) {
      if (!card.labels) continue;
      card.labels = card.labels.filter((label) => label.id !== labelId);
    }
  }
};

export const findCardInLists = (lists: List[], cardId: number) => {
  for (const list of lists) {
    const card = list.cards?.find((c) => c.id === cardId);
    if (card) return card;
  }
  return null;
};

export const findChecklistInCard = (card: Card, checklistId: number) => {
  return card.checklists?.find((c) => c.id === checklistId) || null;
};

export const removeChecklistFromCard = (card: Card, checklistId: number) => {
  if (!card.checklists) return false;
  const idx = card.checklists.findIndex((checklist) => checklist.id === checklistId);
  if (idx === -1) return false;
  card.checklists.splice(idx, 1);
  return true;
};

export const removeCardFromLists = (lists: List[], cardId: number) => {
  lists.forEach((list) => {
    if (!list.cards) return;
    list.cards = list.cards.filter((c) => c.id !== cardId);
  });
};

export const upsertCardIntoLists = (lists: List[], card: Card) => {
  removeCardFromLists(lists, card.id);
  const targetList = lists.find((l) => l.id === card.list);
  if (!targetList) return;
  if (!targetList.cards) targetList.cards = [];
  targetList.cards.push(card);
  targetList.cards.sort((a, b) => Number(a.order) - Number(b.order));
};

export const upsertListIntoLists = (lists: List[], nextListInput: Partial<List> & { id: number }) => {
  const nextList: List = {
    ...nextListInput,
    cards: nextListInput.cards ?? [],
  } as List;
  const existingIndex = lists.findIndex((list) => list.id === nextList.id);
  if (existingIndex !== -1) {
    lists[existingIndex] = {
      ...lists[existingIndex],
      ...nextList,
      cards: nextList.cards ?? lists[existingIndex].cards ?? [],
    };
  } else {
    lists.push(nextList);
  }
  lists.sort((a, b) => Number(a.order) - Number(b.order));
};

export const reorderActiveListsById = (lists: List[], listId: number, destActiveIndex: number) => {
  const activeIndices = lists.reduce<number[]>((acc, list, index) => {
    if (!list.is_archived) acc.push(index);
    return acc;
  }, []);
  const activeLists = activeIndices.map((index) => lists[index]);
  const sourceActiveIndex = activeLists.findIndex((list) => list.id === listId);
  if (sourceActiveIndex === -1) return false;

  const boundedDestIndex = Math.max(0, Math.min(destActiveIndex, activeLists.length - 1));
  if (sourceActiveIndex === boundedDestIndex) return false;

  const [moved] = activeLists.splice(sourceActiveIndex, 1);
  activeLists.splice(boundedDestIndex, 0, moved);

  activeIndices.forEach((arrayIndex, idx) => {
    const next = activeLists[idx];
    if (!next) return;
    lists[arrayIndex] = next;
  });

  activeLists.forEach((list, index) => {
    list.order = index + 1;
  });
  return true;
};
