import { captureOperationalError, captureOperationalMessage } from '../../observability/sentry';

export type WsLogLevel = 'debug' | 'info' | 'warn' | 'error';

type WsLogPayload = {
  event: string;
  boardId?: number | null;
  reason?: string;
  code?: number;
  attempt?: number;
  delayMs?: number;
  manual?: boolean;
  details?: unknown;
};

const loggerByLevel: Record<WsLogLevel, (...args: unknown[]) => void> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

export const wsLog = (level: WsLogLevel, payload: WsLogPayload) => {
  const details = {
    event: payload.event,
    boardId: payload.boardId ?? null,
    reason: payload.reason ?? null,
    code: payload.code ?? null,
    attempt: payload.attempt ?? null,
    delayMs: payload.delayMs ?? null,
    manual: payload.manual ?? null,
    details: payload.details ?? null,
  };

  const shouldAlert =
    level === 'error' ||
    payload.event === 'close' ||
    payload.event === 'reconnect_exhausted' ||
    payload.event === 'heartbeat_timeout';

  if (shouldAlert) {
    if (level === 'error') {
      captureOperationalError(payload.details || payload.event, details);
    } else {
      captureOperationalMessage(`[ws] ${payload.event}`, level === 'warn' ? 'warning' : 'info', details);
    }
  }

  loggerByLevel[level]('[WS]', {
    ts: new Date().toISOString(),
    ...payload,
  });
};
