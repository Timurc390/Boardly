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
  loggerByLevel[level]('[WS]', {
    ts: new Date().toISOString(),
    ...payload,
  });
};
