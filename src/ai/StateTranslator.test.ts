// src/ai/StateTranslator.test.ts
import { describe, it, expect } from 'bun:test';
import { translateGameState, createStateTranslator } from './StateTranslator';
import {
  createMockGameState,
  createMockPlayer,
  createMockUnit,
  createMockCard,
  createMockAtom,
} from '@/test/mocks/gameState';

describe('StateTranslator', () => {
  describe('translateGameState', () => {
    describe('basic info', () => {
      it('should convert turn number correctly', () => {
        const gameState = createMockGameState({
          game: { turn: 5, round: 2, turnPlayer: 'player-1', firstPlayer: 'player-1' },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.turn).toBe(5);
      });

      it('should convert round number correctly', () => {
        const gameState = createMockGameState({
          game: { turn: 5, round: 3, turnPlayer: 'player-1', firstPlayer: 'player-1' },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.round).toBe(3);
      });

      it('should identify when it is my turn', () => {
        const gameState = createMockGameState({
          game: { turn: 5, round: 2, turnPlayer: 'player-1', firstPlayer: 'player-1' },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.isMyTurn).toBe(true);
      });

      it('should identify when it is not my turn', () => {
        const gameState = createMockGameState({
          game: { turn: 5, round: 2, turnPlayer: 'player-2', firstPlayer: 'player-1' },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.isMyTurn).toBe(false);
      });
    });

    describe('player resources', () => {
      it('should convert life correctly', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', { life: { current: 5, max: 7 } }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.self.life).toBe(5);
      });

      it('should convert CP correctly', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', { cp: { current: 4, max: 7 } }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.self.cp.current).toBe(4);
        expect(result.context.self.cp.max).toBe(7);
      });

      it('should convert jokerGauge correctly', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', { joker: { card: [], gauge: 75 } }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.self.jokerGauge).toBe(75);
      });

      it('should calculate handCount from hand array length', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', {
              hand: [createMockAtom('card-1'), createMockAtom('card-2'), createMockAtom('card-3')],
            }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.self.handCount).toBe(3);
      });

      it('should calculate deckCount from deck array length', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', {
              deck: [createMockAtom('d1'), createMockAtom('d2')],
            }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.self.deckCount).toBe(2);
      });

      it('should convert opponent resources', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1'),
            'player-2': createMockPlayer('player-2', {
              life: { current: 3, max: 7 },
              cp: { current: 5, max: 6 },
            }),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.opponent.life).toBe(3);
        expect(result.context.opponent.cp.current).toBe(5);
      });
    });

    describe('field conversion', () => {
      it('should convert myField units', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', {
              field: [
                createMockUnit('unit-1', { bp: 5000, currentBP: 6000, active: true }),
                createMockUnit('unit-2', { bp: 3000, currentBP: 3000, active: false }),
              ],
            }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.myField.length).toBe(2);
        expect(result.context.myField[0].bp).toBe(6000);
        expect(result.context.myField[0].baseBp).toBe(5000);
        expect(result.context.myField[0].active).toBe(true);
        expect(result.context.myField[1].active).toBe(false);
      });

      it('should convert opponentField units', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1'),
            'player-2': createMockPlayer('player-2', {
              field: [createMockUnit('unit-3', { bp: 7000, currentBP: 7000 })],
            }),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.opponentField.length).toBe(1);
        expect(result.context.opponentField[0].bp).toBe(7000);
      });

      it('should assign short IDs to units', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', {
              field: [createMockUnit('long-unit-id-12345')],
            }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.myField[0].id).toBe('u1');
        // IdMapperで復元可能
        expect(result.mapper.restoreUnit('u1')).toBe('long-unit-id-12345');
      });
    });

    describe('hand conversion', () => {
      it('should convert hand cards with playable status', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', {
              cp: { current: 3, max: 5 },
              hand: [
                createMockCard('card-1', { currentCost: 2 }),
                createMockCard('card-2', { currentCost: 4 }),
              ],
            }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.myHand.length).toBe(2);
        expect(result.context.myHand[0].playable).toBe(true); // cost 2 <= cp 3
        expect(result.context.myHand[1].playable).toBe(false); // cost 4 > cp 3
      });

      it('should assign short IDs to cards', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', {
              hand: [createMockCard('long-card-id-abc')],
            }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.myHand[0].id).toBe('c1');
        expect(result.mapper.restoreCard('c1')).toBe('long-card-id-abc');
      });
    });

    describe('trigger conversion', () => {
      it('should convert trigger zone cards', () => {
        const gameState = createMockGameState({
          players: {
            'player-1': createMockPlayer('player-1', {
              trigger: [createMockCard('trigger-1'), createMockCard('trigger-2')],
            }),
            'player-2': createMockPlayer('player-2'),
          },
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.context.myTrigger.length).toBe(2);
      });
    });
  });

  describe('createStateTranslator', () => {
    it('should create a translator with persistent IdMapper', () => {
      const translator = createStateTranslator();

      const gameState1 = createMockGameState({
        players: {
          'player-1': createMockPlayer('player-1', {
            field: [createMockUnit('unit-1')],
          }),
          'player-2': createMockPlayer('player-2'),
        },
      });

      const result1 = translator.translate(gameState1, 'player-1');
      expect(result1.context.myField[0].id).toBe('u1');

      // Same unit should get same ID
      const result2 = translator.translate(gameState1, 'player-1');
      expect(result2.context.myField[0].id).toBe('u1');
    });

    it('should allow resetting the IdMapper', () => {
      const translator = createStateTranslator();

      const gameState = createMockGameState({
        players: {
          'player-1': createMockPlayer('player-1', {
            field: [createMockUnit('unit-1')],
          }),
          'player-2': createMockPlayer('player-2'),
        },
      });

      translator.translate(gameState, 'player-1');
      translator.reset();

      // After reset, should restore undefined
      expect(translator.restoreUnit('u1')).toBeUndefined();
    });
  });
});
