import { isRecord, toNumber } from './wsValueUtils';

const ACTIONS = {
  UPDATE_BOARD: 'board/update/fulfilled',
  ADD_LIST: 'board/addList/fulfilled',
  COPY_LIST: 'board/copyList/fulfilled',
  UPDATE_LIST: 'board/updateList/fulfilled',
  MOVE_LIST: 'board/moveList/fulfilled',
  DELETE_LIST: 'board/deleteList/fulfilled',
  REMOVE_MEMBER: 'board/removeMember/fulfilled',
  UPDATE_MEMBER_ROLE: 'board/updateMemberRole/fulfilled',
  ADD_CARD: 'board/addCard/fulfilled',
  UPDATE_CARD: 'board/updateCard/fulfilled',
  DELETE_CARD: 'board/deleteCard/fulfilled',
  MOVE_CARD: 'board/moveCard/fulfilled',
  COPY_CARD: 'board/copyCard/fulfilled',
  JOIN_CARD: 'board/joinCard/fulfilled',
  LEAVE_CARD: 'board/leaveCard/fulfilled',
  REMOVE_CARD_MEMBER: 'board/removeCardMember/fulfilled',
  ADD_CARD_MEMBER: 'board/addCardMember/fulfilled',
  CREATE_LABEL: 'board/createLabel/fulfilled',
  UPDATE_LABEL: 'board/updateLabel/fulfilled',
  DELETE_LABEL: 'board/deleteLabel/fulfilled',
  ADD_CHECKLIST: 'board/addChecklist/fulfilled',
  DELETE_CHECKLIST: 'board/deleteChecklist/fulfilled',
  ADD_CHECKLIST_ITEM: 'board/addChecklistItem/fulfilled',
  UPDATE_CHECKLIST_ITEM: 'board/updateChecklistItem/fulfilled',
  DELETE_CHECKLIST_ITEM: 'board/deleteChecklistItem/fulfilled',
  ADD_COMMENT: 'board/addComment/fulfilled',
  UPDATE_COMMENT: 'board/updateComment/fulfilled',
  DELETE_COMMENT: 'board/deleteComment/fulfilled',
  ADD_ATTACHMENT: 'board/addAttachment/fulfilled',
  DELETE_ATTACHMENT: 'board/deleteAttachment/fulfilled',
} as const;

const hasNumericId = (value: unknown) => isRecord(value) && toNumber(value.id) !== null;

const getNested = (value: unknown, key: string) => (isRecord(value) ? value[key] : undefined);

export const buildOutgoingRealtimePayload = (
  actionType: string,
  rawPayload: unknown,
  metaArg: unknown
) => {
  let payload: unknown = rawPayload;

  if (actionType === ACTIONS.MOVE_CARD && isRecord(metaArg)) {
    const order = toNumber(metaArg.order);
    const listId = toNumber(metaArg.listId);
    if (order !== null && listId !== null) {
      const destIndex = Math.max(0, order - 1);
      payload = {
        card: rawPayload,
        ws_meta: {
          destListId: listId,
          destIndex,
        },
      };
    }
  }

  if ((actionType === ACTIONS.UPDATE_LIST || actionType === ACTIONS.MOVE_LIST) && isRecord(metaArg)) {
    const order = toNumber(metaArg.order);
    if (order !== null) {
      const destIndex = Math.max(0, order - 1);
      payload = {
        list: rawPayload,
        ws_meta: {
          destIndex,
        },
      };
    }
  }

  if (actionType === ACTIONS.ADD_CHECKLIST_ITEM && isRecord(metaArg)) {
    const checklistId = toNumber(metaArg.checklistId);
    if (checklistId !== null) {
      payload = {
        item: rawPayload,
        ws_meta: {
          checklistId,
        },
      };
    }
  }

  if (actionType === ACTIONS.DELETE_CHECKLIST_ITEM && isRecord(metaArg)) {
    const checklistId = toNumber(metaArg.checklistId);
    if (checklistId !== null) {
      payload = {
        itemId: rawPayload,
        ws_meta: {
          checklistId,
        },
      };
    }
  }

  if (actionType === ACTIONS.ADD_COMMENT && isRecord(metaArg)) {
    const cardId = toNumber(metaArg.cardId);
    if (cardId !== null) {
      payload = {
        comment: rawPayload,
        ws_meta: {
          cardId,
        },
      };
    }
  }

  if (actionType === ACTIONS.ADD_CHECKLIST && isRecord(metaArg)) {
    const cardId = toNumber(metaArg.cardId);
    if (cardId !== null) {
      payload = {
        checklist: rawPayload,
        ws_meta: {
          cardId,
        },
      };
    }
  }

  return payload;
};

export const validateRealtimePayloadByAction = (actionType: string, payload: unknown) => {
  switch (actionType) {
    case ACTIONS.UPDATE_BOARD:
      return isRecord(payload);
    case ACTIONS.ADD_LIST:
    case ACTIONS.COPY_LIST:
      return hasNumericId(payload);
    case ACTIONS.UPDATE_LIST:
    case ACTIONS.MOVE_LIST: {
      const listPayload = getNested(payload, 'list') ?? payload;
      return hasNumericId(listPayload);
    }
    case ACTIONS.DELETE_LIST:
      return toNumber(payload) !== null;
    case ACTIONS.REMOVE_MEMBER:
      return toNumber(payload) !== null;
    case ACTIONS.UPDATE_MEMBER_ROLE:
      return hasNumericId(payload);
    case ACTIONS.ADD_CARD:
    case ACTIONS.UPDATE_CARD:
    case ACTIONS.MOVE_CARD:
    case ACTIONS.COPY_CARD:
    case ACTIONS.JOIN_CARD:
    case ACTIONS.LEAVE_CARD:
    case ACTIONS.REMOVE_CARD_MEMBER:
    case ACTIONS.ADD_CARD_MEMBER: {
      const cardPayload = getNested(payload, 'card') ?? payload;
      return hasNumericId(cardPayload);
    }
    case ACTIONS.DELETE_CARD:
      return toNumber(payload) !== null;
    case ACTIONS.CREATE_LABEL:
    case ACTIONS.UPDATE_LABEL:
      return hasNumericId(payload);
    case ACTIONS.DELETE_LABEL:
      return toNumber(payload) !== null;
    case ACTIONS.ADD_CHECKLIST: {
      const checklistPayload = getNested(payload, 'checklist') ?? payload;
      return hasNumericId(checklistPayload);
    }
    case ACTIONS.DELETE_CHECKLIST:
      return toNumber(payload) !== null || toNumber(getNested(payload, 'checklistId')) !== null;
    case ACTIONS.ADD_CHECKLIST_ITEM: {
      const itemPayload = getNested(payload, 'item') ?? payload;
      const checklistId = toNumber(getNested(getNested(payload, 'ws_meta'), 'checklistId'));
      return hasNumericId(itemPayload) && checklistId !== null;
    }
    case ACTIONS.UPDATE_CHECKLIST_ITEM: {
      const itemPayload = getNested(payload, 'item') ?? payload;
      return hasNumericId(itemPayload);
    }
    case ACTIONS.DELETE_CHECKLIST_ITEM:
      return toNumber(payload) !== null || toNumber(getNested(payload, 'itemId')) !== null;
    case ACTIONS.ADD_COMMENT: {
      const commentPayload = getNested(payload, 'comment') ?? payload;
      return hasNumericId(commentPayload);
    }
    case ACTIONS.UPDATE_COMMENT: {
      const commentPayload = getNested(payload, 'comment') ?? payload;
      return hasNumericId(commentPayload);
    }
    case ACTIONS.DELETE_COMMENT:
      return toNumber(payload) !== null || toNumber(getNested(payload, 'commentId')) !== null;
    case ACTIONS.ADD_ATTACHMENT: {
      const attachmentPayload = getNested(payload, 'attachment') ?? payload;
      const cardId = toNumber(getNested(payload, 'cardId'));
      return hasNumericId(attachmentPayload) && cardId !== null;
    }
    case ACTIONS.DELETE_ATTACHMENT: {
      const cardId = toNumber(getNested(payload, 'cardId'));
      const attachmentId = toNumber(getNested(payload, 'attachmentId')) ?? toNumber(payload);
      return cardId !== null && attachmentId !== null;
    }
    default:
      return false;
  }
};
