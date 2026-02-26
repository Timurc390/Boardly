import { Attachment, Checklist, ChecklistItem, Comment, Label, List } from '../../../types';
import { findCardInLists, findChecklistInCard, removeChecklistFromCard, removeLabelFromCards, updateLabelInCards } from './helpers';
import { BoardState } from './types';

export const upsertLabelOnBoard = (state: BoardState, label: Label) => {
  if (!state.currentBoard) return;
  if (!state.currentBoard.labels) state.currentBoard.labels = [];
  const idx = state.currentBoard.labels.findIndex((item) => item.id === label.id);
  if (idx === -1) {
    state.currentBoard.labels.push(label);
  } else {
    state.currentBoard.labels[idx] = { ...state.currentBoard.labels[idx], ...label };
  }
};

export const deleteLabelOnBoard = (state: BoardState, labelId: number) => {
  if (!state.currentBoard?.labels) return;
  state.currentBoard.labels = state.currentBoard.labels.filter((label) => label.id !== labelId);
};

export const applyLabelUpsertEverywhere = (state: BoardState, lists: List[] | null, label: Label) => {
  upsertLabelOnBoard(state, label);
  if (lists) updateLabelInCards(lists, label);
};

export const applyLabelDeleteEverywhere = (state: BoardState, lists: List[] | null, labelId: number) => {
  deleteLabelOnBoard(state, labelId);
  if (lists) removeLabelFromCards(lists, labelId);
};

export const addChecklistToCard = (lists: List[], cardId: number, checklist: Checklist) => {
  const card = findCardInLists(lists, cardId);
  if (!card) return;
  if (!card.checklists) card.checklists = [];
  if (!card.checklists.some((item) => item.id === checklist.id)) {
    card.checklists.push({ ...checklist, items: checklist.items ?? [] });
  }
};

export const deleteChecklistFromLists = (lists: List[], checklistId: number) => {
  for (const list of lists) {
    for (const card of list.cards || []) {
      if (removeChecklistFromCard(card, checklistId)) {
        return;
      }
    }
  }
};

export const addChecklistItemToLists = (lists: List[], checklistId: number, item: ChecklistItem) => {
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
};

export const updateChecklistItemInLists = (lists: List[], updatedItem: ChecklistItem) => {
  for (const list of lists) {
    for (const card of list.cards || []) {
      for (const checklist of card.checklists || []) {
        const idx = checklist.items?.findIndex((item) => item.id === updatedItem.id) ?? -1;
        if (idx !== -1 && checklist.items) {
          checklist.items[idx] = { ...checklist.items[idx], ...updatedItem };
          return;
        }
      }
    }
  }
};

export const deleteChecklistItemFromLists = (lists: List[], checklistItemId: number) => {
  for (const list of lists) {
    for (const card of list.cards || []) {
      for (const checklist of card.checklists || []) {
        if (!checklist.items) continue;
        const idx = checklist.items.findIndex((item) => item.id === checklistItemId);
        if (idx !== -1) {
          checklist.items.splice(idx, 1);
          return;
        }
      }
    }
  }
};

export const addCommentToCard = (lists: List[], cardId: number, comment: Comment) => {
  const card = findCardInLists(lists, cardId);
  if (!card) return;
  if (!card.comments) card.comments = [];
  card.comments.push(comment);
};

export const updateCommentInLists = (lists: List[], updatedComment: Comment) => {
  const card = lists
    .flatMap((list) => list.cards || [])
    .find((listCard) => listCard.comments?.some((comment) => comment.id === updatedComment.id));
  if (!card?.comments) return;

  const idx = card.comments.findIndex((comment) => comment.id === updatedComment.id);
  if (idx !== -1) {
    card.comments[idx] = { ...card.comments[idx], ...updatedComment };
  }
};

export const deleteCommentFromLists = (lists: List[], commentId: number) => {
  for (const list of lists) {
    for (const card of list.cards || []) {
      if (!card.comments) continue;
      const idx = card.comments.findIndex((comment) => comment.id === commentId);
      if (idx !== -1) {
        card.comments.splice(idx, 1);
        return;
      }
    }
  }
};

export const addAttachmentToCard = (lists: List[], cardId: number, attachment: Attachment) => {
  const card = findCardInLists(lists, cardId);
  if (!card) return;
  if (!card.attachments) card.attachments = [];
  if (!card.attachments.some((item) => item.id === attachment.id)) {
    card.attachments.push(attachment);
  }
};

export const deleteAttachmentFromCard = (lists: List[], cardId: number, attachmentId: number) => {
  const card = findCardInLists(lists, cardId);
  if (!card?.attachments) return;
  card.attachments = card.attachments.filter((attachment) => attachment.id !== attachmentId);
};
