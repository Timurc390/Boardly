import { Attachment, Card, Checklist, ChecklistItem, Comment, Label } from '../../../types';
import { BOARD_REALTIME_ACTIONS, BoardRealtimeActionType } from '../../realtime/boardRealtimeActions';
import { isRecord, toNumber } from '../../realtime/wsValueUtils';
import {
  ensureLists,
  reorderActiveListsById,
  removeCardFromLists,
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

export type SocketUpdatePayload = {
  actionType: BoardRealtimeActionType;
  payload: unknown;
};

const getField = (value: unknown, key: string): unknown => {
  if (!isRecord(value)) return undefined;
  return value[key];
};

const getNumericField = (value: unknown, key: string): number | null =>
  toNumber(getField(value, key));

export const applySocketUpdateReducer = (state: BoardState, action: SocketUpdatePayload) => {
  if (!state.currentBoard) return;
  const { actionType, payload } = action;
  const lists = ensureLists(state);

  switch (actionType) {
    case BOARD_REALTIME_ACTIONS.UPDATE_BOARD: {
      if (!isRecord(payload)) return;
      state.currentBoard = { ...state.currentBoard, ...payload };
      return;
    }
    case BOARD_REALTIME_ACTIONS.ADD_LIST:
    case BOARD_REALTIME_ACTIONS.COPY_LIST: {
      if (!lists) return;
      if (!isRecord(payload) || typeof payload.id !== 'number') return;
      upsertListIntoLists(lists, payload as { id: number });
      return;
    }
    case BOARD_REALTIME_ACTIONS.UPDATE_LIST:
    case BOARD_REALTIME_ACTIONS.MOVE_LIST: {
      if (!lists) return;
      const nextList = getField(payload, 'list') ?? payload;
      const wsMeta = getField(payload, 'ws_meta');
      if (!isRecord(nextList)) return;
      const idx = lists.findIndex((list) => list.id === nextList.id);
      if (idx !== -1) lists[idx] = { ...lists[idx], ...nextList };
      const destIndex = getNumericField(wsMeta, 'destIndex');
      if (destIndex !== null && isRecord(nextList) && typeof nextList.id === 'number') {
        reorderActiveListsById(lists, nextList.id, destIndex);
      } else {
        lists.sort((a, b) => Number(a.order) - Number(b.order));
      }
      return;
    }
    case BOARD_REALTIME_ACTIONS.DELETE_LIST: {
      if (!lists) return;
      const listId = toNumber(payload);
      if (listId === null) return;
      state.currentBoard.lists = lists.filter((list) => list.id !== listId);
      return;
    }
    case BOARD_REALTIME_ACTIONS.REMOVE_MEMBER: {
      if (!state.currentBoard?.members) return;
      const membershipId = toNumber(payload);
      if (membershipId === null) return;
      state.currentBoard.members = state.currentBoard.members.filter((member) => member.id !== membershipId);
      return;
    }
    case BOARD_REALTIME_ACTIONS.UPDATE_MEMBER_ROLE: {
      if (!state.currentBoard?.members) return;
      if (!isRecord(payload)) return;
      const idx = state.currentBoard.members.findIndex((member) => member.id === payload.id);
      if (idx !== -1) {
        state.currentBoard.members[idx] = { ...state.currentBoard.members[idx], ...payload };
      }
      return;
    }
    case BOARD_REALTIME_ACTIONS.ADD_CARD:
    case BOARD_REALTIME_ACTIONS.UPDATE_CARD:
    case BOARD_REALTIME_ACTIONS.MOVE_CARD:
    case BOARD_REALTIME_ACTIONS.COPY_CARD:
    case BOARD_REALTIME_ACTIONS.JOIN_CARD:
    case BOARD_REALTIME_ACTIONS.LEAVE_CARD:
    case BOARD_REALTIME_ACTIONS.REMOVE_CARD_MEMBER:
    case BOARD_REALTIME_ACTIONS.ADD_CARD_MEMBER: {
      if (!lists) return;
      const nextCard = getField(payload, 'card') ?? payload;
      const wsMeta = getField(payload, 'ws_meta');
      if (!isRecord(nextCard)) return;
      const nextCardId = toNumber(nextCard.id);
      if (nextCardId === null) return;
      const destListId = getNumericField(wsMeta, 'destListId');
      const destIndex = getNumericField(wsMeta, 'destIndex');
      if (destListId !== null && destIndex !== null) {
        removeCardFromLists(lists, nextCardId);
        const targetList = lists.find((list) => list.id === destListId);
        if (!targetList) return;
        if (!targetList.cards) targetList.cards = [];
        const insertAt = Math.max(0, Math.min(destIndex, targetList.cards.length));
        targetList.cards.splice(insertAt, 0, nextCard as unknown as Card);
        targetList.cards.forEach((card, i) => {
          card.order = i + 1;
        });
      } else {
        upsertCardIntoLists(lists, nextCard as unknown as Card);
      }
      return;
    }
    case BOARD_REALTIME_ACTIONS.DELETE_CARD: {
      if (!lists) return;
      const cardId = toNumber(payload);
      if (cardId === null) return;
      removeCardFromLists(lists, cardId);
      return;
    }
    case BOARD_REALTIME_ACTIONS.CREATE_LABEL:
    case BOARD_REALTIME_ACTIONS.UPDATE_LABEL: {
      if (!isRecord(payload)) return;
      applyLabelUpsertEverywhere(state, lists, payload as unknown as Label);
      return;
    }
    case BOARD_REALTIME_ACTIONS.DELETE_LABEL: {
      const labelId = toNumber(payload);
      if (labelId === null) return;
      applyLabelDeleteEverywhere(state, lists, labelId);
      return;
    }
    case BOARD_REALTIME_ACTIONS.ADD_CHECKLIST: {
      if (!lists) return;
      const checklist = getField(payload, 'checklist') ?? payload;
      const wsMeta = getField(payload, 'ws_meta');
      const wsCardId = getNumericField(wsMeta, 'cardId');
      const checklistCardId = isRecord(checklist)
        ? toNumber(checklist.card ?? checklist.card_id)
        : null;
      const targetCardId = wsCardId ?? checklistCardId;
      if (!targetCardId) return;
      addChecklistToCard(lists, targetCardId, checklist as Checklist);
      return;
    }
    case BOARD_REALTIME_ACTIONS.DELETE_CHECKLIST: {
      if (!lists) return;
      const checklistId = getNumericField(payload, 'checklistId') ?? toNumber(payload);
      if (checklistId === null) return;
      deleteChecklistFromLists(lists, checklistId);
      return;
    }
    case BOARD_REALTIME_ACTIONS.ADD_CHECKLIST_ITEM: {
      if (!lists) return;
      const item = getField(payload, 'item') ?? payload;
      const checklistId = getNumericField(getField(payload, 'ws_meta'), 'checklistId');
      if (!checklistId) return;
      addChecklistItemToLists(lists, checklistId, item as ChecklistItem);
      return;
    }
    case BOARD_REALTIME_ACTIONS.UPDATE_CHECKLIST_ITEM: {
      if (!lists) return;
      const updatedItem = getField(payload, 'item') ?? payload;
      updateChecklistItemInLists(lists, updatedItem as ChecklistItem);
      return;
    }
    case BOARD_REALTIME_ACTIONS.DELETE_CHECKLIST_ITEM: {
      if (!lists) return;
      const deletedId = getNumericField(payload, 'itemId') ?? toNumber(payload);
      if (deletedId === null) return;
      deleteChecklistItemFromLists(lists, deletedId);
      return;
    }
    case BOARD_REALTIME_ACTIONS.ADD_COMMENT: {
      if (!lists) return;
      const comment = getField(payload, 'comment') ?? payload;
      const wsCardId = getNumericField(getField(payload, 'ws_meta'), 'cardId');
      const commentCardId = isRecord(comment) ? toNumber(comment.card) : null;
      const cardId = wsCardId ?? commentCardId;
      if (!cardId) return;
      addCommentToCard(lists, cardId, comment as Comment);
      return;
    }
    case BOARD_REALTIME_ACTIONS.UPDATE_COMMENT: {
      if (!lists) return;
      const updated = getField(payload, 'comment') ?? payload;
      updateCommentInLists(lists, updated as Comment);
      return;
    }
    case BOARD_REALTIME_ACTIONS.DELETE_COMMENT: {
      if (!lists) return;
      const deletedId = getNumericField(payload, 'commentId') ?? toNumber(payload);
      if (deletedId === null) return;
      deleteCommentFromLists(lists, deletedId);
      return;
    }
    case BOARD_REALTIME_ACTIONS.ADD_ATTACHMENT: {
      if (!lists) return;
      const cardId = getNumericField(payload, 'cardId');
      const attachment = getField(payload, 'attachment') ?? payload;
      if (!cardId || !attachment) return;
      addAttachmentToCard(lists, cardId, attachment as Attachment);
      return;
    }
    case BOARD_REALTIME_ACTIONS.DELETE_ATTACHMENT: {
      if (!lists) return;
      const cardId = getNumericField(payload, 'cardId');
      const attachmentId = getNumericField(payload, 'attachmentId') ?? toNumber(payload);
      if (!cardId || !attachmentId) return;
      deleteAttachmentFromCard(lists, cardId, attachmentId);
      return;
    }
    default:
      return;
  }
};
