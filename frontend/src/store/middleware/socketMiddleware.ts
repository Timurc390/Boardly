import { Middleware } from '@reduxjs/toolkit';
import { applySocketUpdate, setSocketStatus } from '../slices/boardSlice';

let socket: WebSocket | null = null;
let currentBoardId: number | null = null;
let reconnectAttempts = 0;
let reconnectTimer: number | null = null;
let manualClose = false;

const getReconnectDelay = () => Math.min(1000 * (reconnectAttempts + 1), 10000);

const buildWsUrl = (boardId: number, token: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
  return `${protocol}//${host}/ws/board/${boardId}/?token=${token}`;
};

const attachSocketHandlers = (store: any) => {
  const { dispatch, getState } = store;
  if (!socket) return;

  socket.onopen = () => {
    console.log(`[WS] Connection established!`);
    reconnectAttempts = 0;
    dispatch(setSocketStatus(true));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[WS] Incoming Broadcast:', data);

      const state = getState() as any;
      const myUserId = state.auth.user?.id;
      if (data?.sender_id && myUserId && data.sender_id === myUserId) {
        return;
      }
      if (data.type === 'board_updated' && data.action_type) {
        dispatch(applySocketUpdate({ actionType: data.action_type, payload: data.payload }));
      }
    } catch (err) {
      console.error('[WS] Error parsing message:', err);
    }
  };

  socket.onclose = () => {
    console.log(`[WS] Connection closed.`);
    dispatch(setSocketStatus(false));

    if (!manualClose && currentBoardId) {
      reconnectAttempts += 1;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      const delay = getReconnectDelay();
      reconnectTimer = window.setTimeout(() => {
        const state = getState() as any;
        const token = state.auth.token || localStorage.getItem('authToken');
        if (!token || !currentBoardId) return;
        console.log(`[WS] Reconnecting to board ${currentBoardId}...`);
        socket = new WebSocket(buildWsUrl(currentBoardId, token));
        attachSocketHandlers(store);
      }, delay);
    }
  };
};

export const socketMiddleware: Middleware = (store) => (next) => (action: any) => {
  const { dispatch, getState } = store;

  if (action.type === 'board/fetchById/pending') {
    const boardId = action.meta.arg;
    const state = getState() as any;

    const token = state.auth.token || localStorage.getItem('authToken');

    if (!token) {
      console.warn('[WS] No token found, skipping connection');
      return next(action);
    }

    if (socket) {
      manualClose = true;
      socket.close();
    }

    currentBoardId = boardId;
    manualClose = false;

    const wsUrl = buildWsUrl(boardId, token);
    console.log(`[WS] Connecting to board ${boardId}...`);
    socket = new WebSocket(wsUrl);
    attachSocketHandlers(store);
  }

  const actionsToBroadcast = [
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
    'board/addComment/fulfilled'
  ];

  const result = next(action);

  if (actionsToBroadcast.includes(action.type) && socket?.readyState === WebSocket.OPEN) {
    console.log(`[WS] Sending action to others: ${action.type}`);
    const state = getState() as any;
    let payload = action.payload;

    if (action.type === 'board/moveCard/fulfilled' && action.meta?.arg) {
      const destIndex = Math.max(0, (action.meta.arg.order ?? 1) - 1);
      payload = {
        card: action.payload,
        ws_meta: {
          destListId: action.meta.arg.listId,
          destIndex,
        },
      };
    }

    if ((action.type === 'board/updateList/fulfilled' || action.type === 'board/moveList/fulfilled') && action.meta?.arg?.order !== undefined) {
      const destIndex = Math.max(0, action.meta.arg.order - 1);
      payload = {
        list: action.payload,
        ws_meta: {
          destIndex,
        },
      };
    }

    if (action.type === 'board/addChecklistItem/fulfilled' && action.meta?.arg?.checklistId) {
      payload = {
        item: action.payload,
        ws_meta: {
          checklistId: action.meta.arg.checklistId,
        },
      };
    }

    if (action.type === 'board/deleteChecklistItem/fulfilled' && action.meta?.arg?.checklistId) {
      payload = {
        itemId: action.payload,
        ws_meta: {
          checklistId: action.meta.arg.checklistId,
        },
      };
    }

    if (action.type === 'board/addComment/fulfilled' && action.meta?.arg?.cardId) {
      payload = {
        comment: action.payload,
        ws_meta: {
          cardId: action.meta.arg.cardId,
        },
      };
    }

    socket.send(JSON.stringify({
      type: 'board_updated',
      action_type: action.type,
      payload,
      board_id: state.board?.currentBoard?.id,
      sender_id: state.auth?.user?.id
    }));
  }

  if (action.type === 'auth/logout/fulfilled' || action.type === 'board/clearCurrentBoard') {
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
