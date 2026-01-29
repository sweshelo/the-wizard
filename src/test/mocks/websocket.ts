// src/test/mocks/websocket.ts
import { mock } from 'bun:test';

/**
 * テスト用のモックメッセージ型
 */
interface MockMessage {
  action: { handler?: string; type: string };
  payload: Record<string, unknown>;
}

/**
 * WebSocketServiceのモック
 */
export interface MockWebSocketService {
  send: ReturnType<typeof mock>;
  request: ReturnType<typeof mock>;
  isConnected: ReturnType<typeof mock>;
  setErrorHandler: ReturnType<typeof mock>;
  setWarningHandler: ReturnType<typeof mock>;
  setDisconnectHandler: ReturnType<typeof mock>;
  on: ReturnType<typeof mock>;
  emit: ReturnType<typeof mock>;
  _triggerMessage: (message: MockMessage) => void;
}

/**
 * WebSocketServiceのモックを作成
 */
export const createMockWebSocketService = (): MockWebSocketService => {
  const listeners: Map<string, Array<(data: unknown) => void>> = new Map();

  const service: MockWebSocketService = {
    send: mock((_message: MockMessage) => {}),

    request: mock((_message: MockMessage): Promise<MockMessage> => {
      return Promise.resolve({
        action: { handler: 'client', type: 'response' },
        payload: { requestId: 'mock-request-id' },
      });
    }),

    isConnected: mock(() => true),

    setErrorHandler: mock(
      (_handler: (message: string, title?: string, onConfirm?: () => void) => void) => {}
    ),

    setWarningHandler: mock(
      (_handler: (message: string, title?: string, onConfirm?: () => void) => void) => {}
    ),

    setDisconnectHandler: mock((_handler: (isWaitingReconnect: boolean) => void) => {}),

    on: mock((event: string, handler: (data: unknown) => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)?.push(handler);
    }),

    emit: mock((event: string, data: unknown) => {
      const handlers = listeners.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          handler(data);
        });
      }
    }),

    /**
     * テスト用: メッセージイベントを手動でトリガー
     */
    _triggerMessage: (message: MockMessage) => {
      const handlers = listeners.get('message');
      if (handlers) {
        handlers.forEach(handler => {
          handler(message);
        });
      }
    },
  };

  return service;
};

/**
 * 特定のレスポンスを返すWebSocketモックを作成
 */
export const createMockWebSocketWithResponse = (
  response: Record<string, unknown>
): MockWebSocketService => {
  const service = createMockWebSocketService();
  service.request = mock(() =>
    Promise.resolve({
      action: { handler: 'client', type: 'response' },
      payload: response,
    })
  );
  return service;
};
