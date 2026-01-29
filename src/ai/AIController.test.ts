// src/ai/AIController.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { AIController, createAIController } from './AIController';
import type { AIEvent, AIControllerResponse } from './AIController';
import type { AIGameContext } from './types';
import type { Message } from '@/submodule/suit/types';

// テスト用のモックゲームコンテキスト
const createMockContext = (): AIGameContext => ({
  turn: 1,
  round: 1,
  isMyTurn: true,
  self: {
    life: 8,
    cp: { current: 2, max: 2 },
    jokerGauge: 0,
    handCount: 5,
    deckCount: 35,
  },
  opponent: {
    life: 8,
    cp: { current: 2, max: 2 },
    jokerGauge: 0,
    handCount: 5,
    deckCount: 35,
  },
  myField: [],
  opponentField: [],
  myHand: [],
  myTrigger: [],
  recentEvents: [],
});

describe('AIController', () => {
  let controller: AIController;
  const playerId = 'player-123';

  beforeEach(() => {
    controller = createAIController({
      enabled: true,
      playerId,
    });
  });

  describe('initialization', () => {
    it('should be created with correct initial state', () => {
      expect(controller.isEnabled()).toBe(true);
      expect(controller.getPlayerId()).toBe(playerId);
      expect(controller.getGameContext()).toBeNull();
    });

    it('should be created in disabled state when specified', () => {
      const disabledController = createAIController({
        enabled: false,
        playerId,
      });
      expect(disabledController.isEnabled()).toBe(false);
    });
  });

  describe('enable/disable', () => {
    it('should enable AI mode', () => {
      controller.disable();
      expect(controller.isEnabled()).toBe(false);
      controller.enable();
      expect(controller.isEnabled()).toBe(true);
    });

    it('should disable AI mode', () => {
      controller.disable();
      expect(controller.isEnabled()).toBe(false);
    });
  });

  describe('game context', () => {
    it('should update game context', () => {
      const context = createMockContext();
      controller.updateGameContext(context);
      expect(controller.getGameContext()).toEqual(context);
    });
  });

  describe('handleMessage', () => {
    it('should return false when disabled', async () => {
      controller.disable();
      const message: Message = {
        payload: { type: 'MulliganStart' },
      };
      const result = await controller.handleMessage(message);
      expect(result).toBe(false);
    });

    it('should return false for non-AI messages', async () => {
      const message: Message = {
        payload: { type: 'Sync', body: {} },
      };
      const result = await controller.handleMessage(message);
      expect(result).toBe(false);
    });

    it('should handle MulliganStart when context is set', async () => {
      const context = createMockContext();
      controller.updateGameContext(context);

      let receivedEvent: AIEvent | null = null;
      const mockHandler = mock(async (event: AIEvent): Promise<AIControllerResponse> => {
        receivedEvent = event;
        return {
          type: 'mulligan',
          mulligan: { shouldMulligan: false, reason: 'Good hand' },
        };
      });
      controller.setDecisionHandler(mockHandler);

      const message: Message = {
        payload: { type: 'MulliganStart' },
      };
      const result = await controller.handleMessage(message);

      expect(result).toBe(true);
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent?.type).toBe('mulligan');
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle Choices message for option type', async () => {
      const context = createMockContext();
      controller.updateGameContext(context);

      let receivedEvent: AIEvent | null = null;
      const mockHandler = mock(async (event: AIEvent): Promise<AIControllerResponse> => {
        receivedEvent = event;
        return {
          type: 'choice',
          choice: { selectedIds: ['option-1'], reason: 'Best option' },
        };
      });
      controller.setDecisionHandler(mockHandler);

      const message: Message = {
        payload: {
          type: 'Choices',
          player: playerId,
          promptId: 'prompt-123',
          choices: {
            type: 'option',
            items: [
              { id: 'option-1', description: 'Option 1' },
              { id: 'option-2', description: 'Option 2' },
            ],
          },
        },
      };
      const result = await controller.handleMessage(message);

      expect(result).toBe(true);
      expect(receivedEvent?.type).toBe('choice_option');
      expect(receivedEvent?.promptId).toBe('prompt-123');
    });

    it('should handle Choices message for unit type', async () => {
      const context = createMockContext();
      controller.updateGameContext(context);

      let receivedEvent: AIEvent | null = null;
      const mockHandler = mock(async (event: AIEvent): Promise<AIControllerResponse> => {
        receivedEvent = event;
        return {
          type: 'choice',
          choice: { selectedIds: ['u1'], reason: 'Target unit' },
        };
      });
      controller.setDecisionHandler(mockHandler);

      const message: Message = {
        payload: {
          type: 'Choices',
          player: playerId,
          promptId: 'prompt-456',
          choices: {
            type: 'unit',
            items: [{ id: 'u1', name: 'Unit 1' }],
            title: 'Select target',
            isCancelable: true,
          },
        },
      };
      const result = await controller.handleMessage(message);

      expect(result).toBe(true);
      expect(receivedEvent?.type).toBe('choice_unit');
      expect(receivedEvent?.choices?.isCancelable).toBe(true);
    });

    it('should handle Choices message for block type', async () => {
      const context = createMockContext();
      controller.updateGameContext(context);

      const mockHandler = mock(async (_event: AIEvent): Promise<AIControllerResponse> => {
        return {
          type: 'choice',
          choice: { selectedIds: ['u2'], reason: 'Block with this unit' },
        };
      });
      controller.setDecisionHandler(mockHandler);

      const message: Message = {
        payload: {
          type: 'Choices',
          player: playerId,
          promptId: 'prompt-789',
          choices: {
            type: 'block',
            items: [{ id: 'u2', name: 'Blocker Unit' }],
          },
        },
      };
      const result = await controller.handleMessage(message);

      expect(result).toBe(true);
    });

    it('should not handle Choices for other players', async () => {
      const context = createMockContext();
      controller.updateGameContext(context);

      const mockHandler = mock(async (_event: AIEvent): Promise<AIControllerResponse> => {
        return { type: 'choice', choice: { selectedIds: [], reason: '' } };
      });
      controller.setDecisionHandler(mockHandler);

      const message: Message = {
        payload: {
          type: 'Choices',
          player: 'other-player',
          promptId: 'prompt-123',
          choices: {
            type: 'option',
            items: [],
          },
        },
      };
      const result = await controller.handleMessage(message);

      expect(result).toBe(false);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle DisplayEffect (continue)', async () => {
      const context = createMockContext();
      controller.updateGameContext(context);

      let receivedEvent: AIEvent | null = null;
      const mockHandler = mock(async (event: AIEvent): Promise<AIControllerResponse> => {
        receivedEvent = event;
        return { type: 'continue' };
      });
      controller.setDecisionHandler(mockHandler);

      const message: Message = {
        payload: {
          type: 'DisplayEffect',
          promptId: 'prompt-abc',
          title: 'Effect',
          message: 'Some effect',
        },
      };
      const result = await controller.handleMessage(message);

      expect(result).toBe(true);
      expect(receivedEvent?.type).toBe('continue');
      expect(receivedEvent?.promptId).toBe('prompt-abc');
    });
  });

  describe('Operation handling', () => {
    it('should handle freeze operation', async () => {
      const context = createMockContext();
      controller.updateGameContext(context);

      const message: Message = {
        payload: {
          type: 'Operation',
          action: 'freeze',
        },
      };
      const result = await controller.handleMessage(message);

      // Operationは通常処理にも委譲
      expect(result).toBe(false);
    });

    it('should handle defrost operation', async () => {
      const context = createMockContext();
      controller.updateGameContext(context);

      // First freeze
      await controller.handleMessage({
        payload: { type: 'Operation', action: 'freeze' },
      });

      // Then defrost
      const result = await controller.handleMessage({
        payload: { type: 'Operation', action: 'defrost' },
      });

      expect(result).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset controller state', () => {
      const context = createMockContext();
      controller.updateGameContext(context);

      controller.reset();

      expect(controller.getGameContext()).toBeNull();
    });
  });
});
