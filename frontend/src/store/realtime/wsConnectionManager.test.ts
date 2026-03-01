import { createWsConnectionManager } from './wsConnectionManager';

type CloseEventLike = {
  code: number;
  reason: string;
  wasClean: boolean;
};

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public onopen: (() => void) | null = null;
  public onclose: ((event: CloseEventLike) => void) | null = null;
  public onerror: ((event: unknown) => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public readyState = FakeWebSocket.CONNECTING;
  public sent: string[] = [];
  public readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code: 1000, reason: 'manual', wasClean: true });
  }

  emitOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  emitClose(event: CloseEventLike) {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(event);
  }
}

describe('wsConnectionManager reconnect behavior', () => {
  const originalWebSocket = global.WebSocket;

  beforeEach(() => {
    jest.useFakeTimers();
    FakeWebSocket.instances = [];
    (global as any).WebSocket = FakeWebSocket;
  });

  afterEach(() => {
    jest.useRealTimers();
    (global as any).WebSocket = originalWebSocket;
  });

  it('reconnects after unexpected close', () => {
    const lifecycleEvents: string[] = [];
    const manager = createWsConnectionManager({
      buildWsUrl: (boardId, token) => `ws://localhost/ws/${boardId}?token=${token}`,
      getToken: () => 'token',
      onStatusChange: () => undefined,
      onMessage: () => undefined,
      onLifecycleEvent: (event) => lifecycleEvents.push(event.type),
      baseReconnectDelayMs: 1000,
      maxReconnectDelayMs: 1000,
      reconnectJitterMs: 0,
      maxReconnectAttempts: 3,
    });

    manager.connect(10, 'token');
    expect(FakeWebSocket.instances).toHaveLength(1);

    FakeWebSocket.instances[0].emitClose({ code: 1006, reason: 'network', wasClean: false });
    expect(lifecycleEvents).toContain('reconnect_scheduled');

    jest.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(lifecycleEvents).toContain('reconnect_attempt');
  });

  it('does not reconnect after manual close', () => {
    const lifecycleEvents: string[] = [];
    const manager = createWsConnectionManager({
      buildWsUrl: (boardId, token) => `ws://localhost/ws/${boardId}?token=${token}`,
      getToken: () => 'token',
      onStatusChange: () => undefined,
      onMessage: () => undefined,
      onLifecycleEvent: (event) => lifecycleEvents.push(event.type),
      baseReconnectDelayMs: 1000,
      maxReconnectDelayMs: 1000,
      reconnectJitterMs: 0,
      maxReconnectAttempts: 3,
    });

    manager.connect(11, 'token');
    expect(FakeWebSocket.instances).toHaveLength(1);

    manager.close();
    jest.advanceTimersByTime(5000);

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(lifecycleEvents).toContain('manual_close');
    expect(lifecycleEvents).not.toContain('reconnect_scheduled');
  });
});
