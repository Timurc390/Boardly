import { type Middleware } from '@reduxjs/toolkit';
import { applySocketUpdate, setSocketStatus } from '../slices/boardSlice';
import { API_URL } from '../../api/client';
import { BOARD_REALTIME_BROADCAST_ACTIONS, type BoardRealtimeActionType } from '../realtime/boardRealtimeActions';
import {
  buildOutgoingRealtimePayload,
  validateRealtimePayloadByAction,
} from '../realtime/wsPayloadMapper';
import { createWsConnectionManager } from '../realtime/wsConnectionManager';
import { isRecord, toNumber } from '../realtime/wsValueUtils';
import { wsLog } from '../realtime/wsLogger';

type SocketState = {
  auth: {
    token?: string | null;
    user?: { id?: number | null } | null;
  };
  board: {
    currentBoard?: { id?: number | null } | null;
  };
};

const WS_HEARTBEAT_ACTION = 'board/ws_heartbeat/fulfilled';

type ReconnectMetrics = {
  scheduled: number;
  exhausted: number;
  lastAttempt: number;
  lastDelayMs: number;
};

const getActionType = (action: unknown): string | null => {
  if (!isRecord(action) || typeof action.type !== 'string') return null;
  return action.type;
};

const getMetaArg = (action: unknown): unknown => {
  if (!isRecord(action) || !isRecord(action.meta)) return undefined;
  return action.meta.arg;
};

const normalizeBase = (value: string) => value.replace(/\/+$/, '');

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

const buildWsUrl = (boardId: number, token: string) => `${getWsBase()}/ws/board/${boardId}/?token=${token}`;

const toPositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

export const socketMiddleware: Middleware = (storeApi) => {
  const getState = () => storeApi.getState() as SocketState;
  const getToken = () => getState().auth.token || localStorage.getItem('authToken');

  const heartbeatIntervalMs = toPositiveInt(process.env.REACT_APP_WS_HEARTBEAT_MS, 15000);
  const heartbeatTimeoutMs = toPositiveInt(process.env.REACT_APP_WS_HEARTBEAT_TIMEOUT_MS, 45000);
  let heartbeatTimer: number | null = null;
  let heartbeatTimeoutTimer: number | null = null;
  let lastHeartbeatAckAt = 0;

  const reconnectMetrics: ReconnectMetrics = {
    scheduled: 0,
    exhausted: 0,
    lastAttempt: 0,
    lastDelayMs: 0,
  };

  const clearHeartbeatTimers = () => {
    if (heartbeatTimer !== null) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (heartbeatTimeoutTimer !== null) {
      window.clearTimeout(heartbeatTimeoutTimer);
      heartbeatTimeoutTimer = null;
    }
  };

  const scheduleHeartbeatTimeoutCheck = () => {
    if (heartbeatTimeoutTimer !== null) {
      window.clearTimeout(heartbeatTimeoutTimer);
    }

    heartbeatTimeoutTimer = window.setTimeout(() => {
      const now = Date.now();
      if (!lastHeartbeatAckAt || now - lastHeartbeatAckAt > heartbeatTimeoutMs) {
        wsLog('warn', {
          event: 'heartbeat_timeout',
          boardId: getState().board.currentBoard?.id ?? null,
          details: {
            timeoutMs: heartbeatTimeoutMs,
            lastAckAt: lastHeartbeatAckAt || null,
          },
        });
      }
    }, heartbeatTimeoutMs + 500);
  };

  const startHeartbeat = () => {
    clearHeartbeatTimers();
    lastHeartbeatAckAt = Date.now();

    heartbeatTimer = window.setInterval(() => {
      if (!manager.isOpen()) return;
      const state = getState();
      const boardId = state.board?.currentBoard?.id;
      if (!boardId) return;

      manager.send(
        JSON.stringify({
          type: 'board_updated',
          action_type: WS_HEARTBEAT_ACTION,
          payload: { ts: Date.now() },
          board_id: boardId,
          sender_id: state.auth?.user?.id,
        })
      );

      scheduleHeartbeatTimeoutCheck();
    }, heartbeatIntervalMs);
  };

  const manager = createWsConnectionManager({
    buildWsUrl,
    getToken,
    onStatusChange: (isConnected) => {
      storeApi.dispatch(setSocketStatus(isConnected));
      if (isConnected) {
        startHeartbeat();
      } else {
        clearHeartbeatTimers();
      }
    },
    onError: (error) => {
      wsLog('error', {
        event: 'socket_error',
        boardId: getState().board.currentBoard?.id ?? null,
        details: error,
      });
    },
    onLifecycleEvent: (event) => {
      switch (event.type) {
        case 'connect_start':
          wsLog('info', { event: 'connect_start', boardId: event.boardId });
          break;
        case 'open':
          wsLog('info', {
            event: 'open',
            boardId: event.boardId,
            attempt: event.reconnectAttempts,
          });
          break;
        case 'error':
          wsLog('error', {
            event: 'lifecycle_error',
            boardId: event.boardId,
            details: event.details,
          });
          break;
        case 'close':
          wsLog('warn', {
            event: 'close',
            boardId: event.boardId,
            code: event.code,
            reason: event.reason || 'no_reason',
            manual: event.manual,
            details: { wasClean: event.wasClean },
          });
          break;
        case 'reconnect_scheduled':
          reconnectMetrics.scheduled += 1;
          reconnectMetrics.lastAttempt = event.attempt;
          reconnectMetrics.lastDelayMs = event.delayMs;
          wsLog('info', {
            event: 'reconnect_scheduled',
            boardId: event.boardId,
            attempt: event.attempt,
            delayMs: event.delayMs,
            details: reconnectMetrics,
          });
          break;
        case 'reconnect_attempt':
          wsLog('info', {
            event: 'reconnect_attempt',
            boardId: event.boardId,
            attempt: event.attempt,
            details: reconnectMetrics,
          });
          break;
        case 'reconnect_exhausted':
          reconnectMetrics.exhausted += 1;
          wsLog('error', {
            event: 'reconnect_exhausted',
            boardId: event.boardId,
            attempt: event.attempt,
            details: reconnectMetrics,
          });
          break;
        case 'manual_close':
          wsLog('debug', {
            event: 'manual_close',
            boardId: event.boardId,
          });
          break;
        default:
          break;
      }
    },
    onMessage: (rawData) => {
      try {
        const data: unknown = JSON.parse(rawData);
        if (!isRecord(data)) return;

        const myUserId = getState().auth.user?.id ?? null;
        const senderId = toNumber(data.sender_id);
        if (senderId && myUserId && senderId === myUserId) {
          if (data.action_type === WS_HEARTBEAT_ACTION) {
            lastHeartbeatAckAt = Date.now();
          }
          return;
        }

        if (data.type === 'board_updated' && typeof data.action_type === 'string') {
          if (data.action_type === WS_HEARTBEAT_ACTION) {
            lastHeartbeatAckAt = Date.now();
            return;
          }

          if (!validateRealtimePayloadByAction(data.action_type, data.payload)) {
            wsLog('warn', {
              event: 'incoming_payload_invalid',
              boardId: toNumber(data.board_id),
              reason: data.action_type,
              details: data.payload,
            });
            return;
          }

          storeApi.dispatch(
            applySocketUpdate({
              actionType: data.action_type as BoardRealtimeActionType,
              payload: data.payload,
            })
          );
        }
      } catch (err) {
        wsLog('error', {
          event: 'message_parse_error',
          boardId: getState().board.currentBoard?.id ?? null,
          details: err,
        });
      }
    },
    maxReconnectAttempts: toPositiveInt(process.env.REACT_APP_WS_MAX_RECONNECT_ATTEMPTS, 20),
    baseReconnectDelayMs: toPositiveInt(process.env.REACT_APP_WS_BASE_RECONNECT_MS, 1000),
    maxReconnectDelayMs: toPositiveInt(process.env.REACT_APP_WS_MAX_RECONNECT_MS, 10000),
    reconnectJitterMs: toPositiveInt(process.env.REACT_APP_WS_RECONNECT_JITTER_MS, 250),
  });

  return (next) => (action) => {
    const actionType = getActionType(action);

    if (actionType === 'board/fetchById/pending') {
      const boardId = toNumber(getMetaArg(action));
      const token = getToken();

      if (token && boardId) {
        manager.connect(boardId, token);
      }
    }

    const result = next(action);

    if (actionType && BOARD_REALTIME_BROADCAST_ACTIONS.has(actionType) && manager.isOpen()) {
      const state = getState();
      const rawAction = isRecord(action) ? action : {};
      const payload = buildOutgoingRealtimePayload(actionType, rawAction.payload, getMetaArg(action));

      if (!validateRealtimePayloadByAction(actionType, payload)) {
        wsLog('warn', {
          event: 'outgoing_payload_invalid',
          boardId: state.board?.currentBoard?.id ?? null,
          reason: actionType,
          details: payload,
        });
        return result;
      }

      manager.send(
        JSON.stringify({
          type: 'board_updated',
          action_type: actionType,
          payload,
          board_id: state.board?.currentBoard?.id,
          sender_id: state.auth?.user?.id,
        })
      );
    }

    if (actionType === 'auth/logout/fulfilled' || actionType === 'board/clearCurrentBoard') {
      clearHeartbeatTimers();
      manager.close();
    }

    return result;
  };
};
