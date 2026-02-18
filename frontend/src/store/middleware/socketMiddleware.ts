import { Middleware } from '@reduxjs/toolkit';
import { applySocketUpdate, setSocketStatus } from '../slices/boardSlice';
import { API_URL } from '../../api/client';
import type { Dispatch } from 'redux';

let socket: WebSocket | null = null;
let currentBoardId: number | null = null;
let reconnectAttempts = 0;
let reconnectTimer: number | null = null;
let manualClose = false;

type UnknownRecord = Record<string, unknown>;
type SocketState = {
  auth: {
    token?: string | null;
    user?: { id?: number | null } | null;
  };
  board: {
    currentBoard?: { id?: number | null } | null;
  };
};
type StoreApi = {
  dispatch: Dispatch;
  getState: () => SocketState;
};

const ACTIONS_TO_BROADCAST = new Set([
  'board/update/fulfilled',
  'board/addList/fulfilled',
  'board/copyList/fulfilled',
  'board/updateList/fulfilled',
  'board/moveList/fulfilled',
  'board/deleteList/fulfilled',
  'board/addCard/fulfilled',
  'board/updateCard/fulfilled',
  'board/deleteCard/fulfilled',
  'board/moveCard/fulfilled',
  'board/copyCard/fulfilled',
  'board/joinCard/fulfilled',
  'board/leaveCard/fulfilled',
  'board/removeCardMember/fulfilled',
  'board/createLabel/fulfilled',
  'board/updateLabel/fulfilled',
  'board/deleteLabel/fulfilled',
  'board/addChecklistItem/fulfilled',
  'board/updateChecklistItem/fulfilled',
  'board/deleteChecklistItem/fulfilled',
  'board/addComment/fulfilled',
  'board/removeMember/fulfilled',
  'board/updateMemberRole/fulfilled'
]);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const normalizeBase = (value: string) => value.replace(/\/+$/, '');
const getReconnectDelay = () => Math.min(1000 * (reconnectAttempts + 1), 10000);

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getActionType = (action: unknown): string | null => {
  if (!isRecord(action) || typeof action.type !== 'string') return null;
  return action.type;
};

const getMetaArg = (action: unknown): unknown => {
  if (!isRecord(action)) return undefined;
  if (!isRecord(action.meta)) return undefined;
  return action.meta.arg;
};

const getWsBase = () => {
  const envWs = process.env.REACT_APP_WS_URL;
  if (envWs) return normalizeBase(envWs);

  if (API_URL && /^https?:\/\//i.test(API_URL)) {
    const api = new URL(API_URL);
    const wsProtocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${api.host}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const host = isLocal ? 'localhost:8000' : window.location.host;
  return `${protocol}//${host}`;
};

const buildWsUrl = (boardId: number, token: string) => {
  const base = getWsBase();
  return `${base}/ws/board/${boardId}/?token=${token}`;
};

const attachSocketHandlers = (storeApi: StoreApi) => {
  const { dispatch, getState } = storeApi;
  if (!socket) return;

  socket.onopen = () => {
    console.log('[WS] Connection established!');
    reconnectAttempts = 0;
    dispatch(setSocketStatus(true));
  };

  socket.onmessage = (event) => {
    try {
      const data: unknown = JSON.parse(event.data);
      if (!isRecord(data)) return;
      console.log('[WS] Incoming Broadcast:', data);

      const myUserId = getState().auth.user?.id ?? null;
      const senderId = toNumber(data.sender_id);
      if (senderId && myUserId && senderId === myUserId) {
        return;
      }

      if (data.type === 'board_updated' && typeof data.action_type === 'string') {
        dispatch(applySocketUpdate({
          actionType: data.action_type,
          payload: data.payload,
        }));
      }
    } catch (err) {
      console.error('[WS] Error parsing message:', err);
    }
  };

  socket.onclose = () => {
    console.log('[WS] Connection closed.');
    dispatch(setSocketStatus(false));

    if (!manualClose && currentBoardId) {
      reconnectAttempts += 1;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      const delay = getReconnectDelay();
      reconnectTimer = window.setTimeout(() => {
        const token = getState().auth.token || localStorage.getItem('authToken');
        if (!token || !currentBoardId) return;
        console.log(`[WS] Reconnecting to board ${currentBoardId}...`);
        socket = new WebSocket(buildWsUrl(currentBoardId, token));
        attachSocketHandlers(storeApi);
      }, delay);
    }
  };
};

export const socketMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const { getState } = storeApi;
  const actionType = getActionType(action);

  if (actionType === 'board/fetchById/pending') {
    const pendingArg = getMetaArg(action);
    const boardId = toNumber(pendingArg);
    const token = getState().auth.token || localStorage.getItem('authToken');

    if (!token || !boardId) {
      if (!token) console.warn('[WS] No token found, skipping connection');
      return next(action);
    }

    const alreadyConnected =
      currentBoardId === boardId &&
      socket &&
      (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING);

    if (!alreadyConnected) {
      if (socket) {
        manualClose = true;
        socket.close();
      }
      currentBoardId = boardId;
      manualClose = false;

      const wsUrl = buildWsUrl(boardId, token);
      console.log(`[WS] Connecting to board ${boardId}...`);
      socket = new WebSocket(wsUrl);
      attachSocketHandlers(storeApi as StoreApi);
    }
  }

  const result = next(action);

  if (actionType && ACTIONS_TO_BROADCAST.has(actionType) && socket?.readyState === WebSocket.OPEN) {
    console.log(`[WS] Sending action to others: ${actionType}`);
    const state = getState();
    const rawAction = isRecord(action) ? action : {};
    const metaArg = getMetaArg(action);
    let payload: unknown = rawAction.payload;

    if (actionType === 'board/moveCard/fulfilled' && isRecord(metaArg)) {
      const order = toNumber(metaArg.order);
      const listId = toNumber(metaArg.listId);
      if (order !== null && listId !== null) {
        const destIndex = Math.max(0, order - 1);
        payload = {
          card: rawAction.payload,
          ws_meta: {
            destListId: listId,
            destIndex,
          },
        };
      }
    }

    if (
      (actionType === 'board/updateList/fulfilled' || actionType === 'board/moveList/fulfilled') &&
      isRecord(metaArg)
    ) {
      const order = toNumber(metaArg.order);
      if (order !== null) {
        const destIndex = Math.max(0, order - 1);
        payload = {
          list: rawAction.payload,
          ws_meta: {
            destIndex,
          },
        };
      }
    }

    if (actionType === 'board/addChecklistItem/fulfilled' && isRecord(metaArg)) {
      const checklistId = toNumber(metaArg.checklistId);
      if (checklistId !== null) {
        payload = {
          item: rawAction.payload,
          ws_meta: {
            checklistId,
          },
        };
      }
    }

    if (actionType === 'board/deleteChecklistItem/fulfilled' && isRecord(metaArg)) {
      const checklistId = toNumber(metaArg.checklistId);
      if (checklistId !== null) {
        payload = {
          itemId: rawAction.payload,
          ws_meta: {
            checklistId,
          },
        };
      }
    }

    if (actionType === 'board/addComment/fulfilled' && isRecord(metaArg)) {
      const cardId = toNumber(metaArg.cardId);
      if (cardId !== null) {
        payload = {
          comment: rawAction.payload,
          ws_meta: {
            cardId,
          },
        };
      }
    }

    socket.send(JSON.stringify({
      type: 'board_updated',
      action_type: actionType,
      payload,
      board_id: state.board?.currentBoard?.id,
      sender_id: state.auth?.user?.id
    }));
  }

  if (actionType === 'auth/logout/fulfilled' || actionType === 'board/clearCurrentBoard') {
    if (socket) {
      manualClose = true;
      socket.close();
      socket = null;
    }
    currentBoardId = null;
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  return result;
};
