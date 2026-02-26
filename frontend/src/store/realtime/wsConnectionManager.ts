type ConnectionStatusCallback = (isConnected: boolean) => void;
type MessageCallback = (rawData: string) => void;
type ErrorCallback = (error: unknown) => void;
type LifecycleCallback = (event: WsLifecycleEvent) => void;

type WsLifecycleEvent =
  | { type: 'connect_start'; boardId: number }
  | { type: 'open'; boardId: number; reconnectAttempts: number }
  | { type: 'error'; boardId: number | null; details: unknown }
  | { type: 'close'; boardId: number | null; code: number; reason: string; wasClean: boolean; manual: boolean }
  | { type: 'reconnect_scheduled'; boardId: number; attempt: number; delayMs: number }
  | { type: 'reconnect_exhausted'; boardId: number; attempt: number }
  | { type: 'reconnect_attempt'; boardId: number; attempt: number }
  | { type: 'manual_close'; boardId: number | null };

type ConnectionManagerOptions = {
  buildWsUrl: (boardId: number, token: string) => string;
  getToken: () => string | null;
  onStatusChange: ConnectionStatusCallback;
  onMessage: MessageCallback;
  onError?: ErrorCallback;
  onLifecycleEvent?: LifecycleCallback;
  maxReconnectAttempts?: number;
  baseReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  reconnectJitterMs?: number;
};

const getReconnectDelay = (
  attempt: number,
  baseReconnectDelayMs: number,
  maxReconnectDelayMs: number,
  reconnectJitterMs: number
) => {
  const steppedDelay = Math.min(baseReconnectDelayMs * attempt, maxReconnectDelayMs);
  const jitter = reconnectJitterMs > 0 ? Math.floor(Math.random() * reconnectJitterMs) : 0;
  return steppedDelay + jitter;
};

export const createWsConnectionManager = ({
  buildWsUrl,
  getToken,
  onStatusChange,
  onMessage,
  onError,
  onLifecycleEvent,
  maxReconnectAttempts = 20,
  baseReconnectDelayMs = 1000,
  maxReconnectDelayMs = 10000,
  reconnectJitterMs = 250,
}: ConnectionManagerOptions) => {
  let socket: WebSocket | null = null;
  let currentBoardId: number | null = null;
  let reconnectAttempts = 0;
  let reconnectTimer: number | null = null;
  let manualClose = false;

  const clearReconnectTimer = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const createSocket = (boardId: number, token: string) => {
    try {
      socket = new WebSocket(buildWsUrl(boardId, token));
      return true;
    } catch (error) {
      onError?.(error);
      onLifecycleEvent?.({
        type: 'error',
        boardId,
        details: error,
      });
      socket = null;
      return false;
    }
  };

  const scheduleReconnect = () => {
    if (manualClose || !currentBoardId) return;
    if (reconnectAttempts >= maxReconnectAttempts) {
      onLifecycleEvent?.({
        type: 'reconnect_exhausted',
        boardId: currentBoardId,
        attempt: reconnectAttempts,
      });
      return;
    }

    reconnectAttempts += 1;
    clearReconnectTimer();
    const delay = getReconnectDelay(
      reconnectAttempts,
      baseReconnectDelayMs,
      maxReconnectDelayMs,
      reconnectJitterMs
    );
    onLifecycleEvent?.({
      type: 'reconnect_scheduled',
      boardId: currentBoardId,
      attempt: reconnectAttempts,
      delayMs: delay,
    });

    reconnectTimer = window.setTimeout(() => {
      const token = getToken();
      if (!token || !currentBoardId) return;
      onLifecycleEvent?.({
        type: 'reconnect_attempt',
        boardId: currentBoardId,
        attempt: reconnectAttempts,
      });
      if (!createSocket(currentBoardId, token)) {
        scheduleReconnect();
        return;
      }
      attachSocketHandlers();
    }, delay);
  };

  const attachSocketHandlers = () => {
    if (!socket) return;

    socket.onopen = () => {
      const boardId = currentBoardId;
      reconnectAttempts = 0;
      onStatusChange(true);
      if (boardId) {
        onLifecycleEvent?.({
          type: 'open',
          boardId,
          reconnectAttempts,
        });
      }
    };

    socket.onmessage = (event) => {
      onMessage(event.data);
    };

    socket.onerror = (event) => {
      onError?.(event);
      onLifecycleEvent?.({
        type: 'error',
        boardId: currentBoardId,
        details: event,
      });
    };

    socket.onclose = (event) => {
      onStatusChange(false);
      onLifecycleEvent?.({
        type: 'close',
        boardId: currentBoardId,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        manual: manualClose,
      });
      scheduleReconnect();
    };
  };

  const connect = (boardId: number, token: string) => {
    const alreadyConnected =
      currentBoardId === boardId &&
      socket &&
      (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING);

    if (alreadyConnected) return;

    if (socket) {
      manualClose = true;
      socket.close();
    }
    clearReconnectTimer();

    currentBoardId = boardId;
    manualClose = false;
    reconnectAttempts = 0;
    onLifecycleEvent?.({
      type: 'connect_start',
      boardId,
    });
    if (!createSocket(boardId, token)) {
      scheduleReconnect();
      return;
    }
    attachSocketHandlers();
  };

  const send = (payload: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(payload);
  };

  const close = () => {
    onLifecycleEvent?.({
      type: 'manual_close',
      boardId: currentBoardId,
    });
    if (socket) {
      manualClose = true;
      socket.close();
      socket = null;
    }
    currentBoardId = null;
    reconnectAttempts = 0;
    clearReconnectTimer();
  };

  const isOpen = () => socket?.readyState === WebSocket.OPEN;

  return {
    connect,
    send,
    close,
    isOpen,
  };
};
