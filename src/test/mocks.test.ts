// src/test/mocks.test.ts
import { describe, it, expect } from 'bun:test';
import {
  createMockAnthropicClient,
  createMockWithResponse,
  createMockWithError,
} from './mocks/anthropic';
import {
  createMockGameState,
  createMockPlayer,
  createMockUnit,
  createGameScenarios,
} from './mocks/gameState';
import { createMockWebSocketService } from './mocks/websocket';

describe('Anthropic モック', () => {
  it('デフォルトレスポンスを返すこと', async () => {
    const client = createMockAnthropicClient();
    const response = await client.messages.create({});

    expect(response.content[0].type).toBe('text');
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it('カスタムレスポンスを返すこと', async () => {
    const client = createMockWithResponse({ action: 'TurnEnd' });
    const response = await client.messages.create({});

    const text = response.content[0].text;
    expect(JSON.parse(text).action).toBe('TurnEnd');
  });

  it('エラーを返すこと', async () => {
    const error = new Error('API Error');
    const client = createMockWithError(error);

    await expect(client.messages.create({})).rejects.toThrow('API Error');
  });
});

describe('GameState モック', () => {
  it('デフォルトゲーム状態を作成できること', () => {
    const gameState = createMockGameState();

    expect(gameState.game.turn).toBe(1);
    expect(gameState.game.round).toBe(1);
    expect(gameState.players).toBeDefined();
  });

  it('カスタムゲーム状態を作成できること', () => {
    const gameState = createMockGameState({
      game: { turn: 5, round: 3, turnPlayer: 'player-2', firstPlayer: 'player-1' },
    });

    expect(gameState.game.turn).toBe(5);
    expect(gameState.game.round).toBe(3);
    expect(gameState.game.turnPlayer).toBe('player-2');
  });

  it('モックプレイヤーを作成できること', () => {
    const player = createMockPlayer('test-player', {
      life: { current: 5, max: 7 },
      cp: { current: 4, max: 6 },
    });

    expect(player.id).toBe('test-player');
    expect(player.life.current).toBe(5);
    expect(player.cp.current).toBe(4);
  });

  it('モックユニットを作成できること', () => {
    const unit = createMockUnit('unit-1', {
      bp: 7000,
      currentBP: 8000,
      active: false,
    });

    expect(unit.id).toBe('unit-1');
    expect(unit.bp).toBe(7000);
    expect(unit.currentBP).toBe(8000);
    expect(unit.active).toBe(false);
  });

  it('シナリオ: 中盤のゲーム状態を作成できること', () => {
    const gameState = createGameScenarios.midGame();

    expect(gameState.game.turn).toBe(3);
    expect(gameState.players?.['player-1']?.life.current).toBe(5);
    expect(gameState.players?.['player-1']?.field.length).toBe(2);
  });
});

describe('WebSocket モック', () => {
  it('モックWebSocketServiceを作成できること', () => {
    const ws = createMockWebSocketService();

    expect(ws.send).toBeDefined();
    expect(ws.request).toBeDefined();
    expect(ws.isConnected).toBeDefined();
  });

  it('isConnected がtrueを返すこと', () => {
    const ws = createMockWebSocketService();

    expect(ws.isConnected()).toBe(true);
  });

  it('sendが呼び出されること', () => {
    const ws = createMockWebSocketService();
    const message = { action: { type: 'test' }, payload: {} };

    ws.send(message);

    expect(ws.send).toHaveBeenCalledTimes(1);
    expect(ws.send).toHaveBeenCalledWith(message);
  });

  it('メッセージイベントをトリガーできること', () => {
    const ws = createMockWebSocketService();
    let receivedMessage: unknown = null;

    ws.on('message', (data: unknown) => {
      receivedMessage = data;
    });

    const testMessage = { action: { type: 'test' }, payload: { data: 'test' } };
    ws._triggerMessage(testMessage);

    expect(receivedMessage).toEqual(testMessage);
  });
});
