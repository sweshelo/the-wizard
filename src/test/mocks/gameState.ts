// src/test/mocks/gameState.ts
import type { GameState } from '@/hooks/game/context';
import type { IPlayer, IUnit, IAtom, ICard } from '@/submodule/suit/types';
import { DEFAULT_ROOM_SETTINGS } from '@/constants/room';

/**
 * モックプレイヤーを作成するヘルパー関数
 */
export const createMockPlayer = (id: string, overrides: Partial<IPlayer> = {}): IPlayer => ({
  id,
  name: `Player ${id}`,
  deck: [],
  hand: [],
  field: [],
  trash: [],
  delete: [],
  trigger: [],
  purple: undefined,
  cp: { current: 3, max: 3 },
  life: { current: 7, max: 7 },
  joker: { card: [], gauge: 0 },
  ...overrides,
});

/**
 * モックカードを作成するヘルパー関数
 */
export const createMockCard = (id: string, overrides: Partial<ICard> = {}): ICard => ({
  id,
  catalogId: `catalog-${id}`,
  lv: 1,
  ...overrides,
});

/**
 * モックAtom（最小カード情報）を作成するヘルパー関数
 */
export const createMockAtom = (id: string): IAtom => ({
  id,
});

/**
 * モックユニットを作成するヘルパー関数
 */
export const createMockUnit = (id: string, overrides: Partial<IUnit> = {}): IUnit => ({
  id,
  catalogId: `catalog-${id}`,
  lv: 1,
  bp: 5000,
  currentBP: 5000,
  active: true,
  isCopy: false,
  hasBootAbility: false,
  isBooted: false,
  ...overrides,
});

/**
 * モックゲーム状態を作成するヘルパー関数
 */
export const createMockGameState = (
  overrides: Partial<{
    players: Record<string, IPlayer>;
    game: Partial<GameState['game']>;
    rule: GameState['rule'];
  }> = {}
): GameState => {
  const defaultPlayers: Record<string, IPlayer> = {
    'player-1': createMockPlayer('player-1'),
    'player-2': createMockPlayer('player-2'),
  };

  return {
    players: overrides.players ?? defaultPlayers,
    game: {
      turn: 1,
      round: 1,
      turnPlayer: 'player-1',
      firstPlayer: 'player-1',
      ...overrides.game,
    },
    rule: overrides.rule ?? DEFAULT_ROOM_SETTINGS.rule,
  };
};

/**
 * 様々なゲーム状態のシナリオを作成
 */
export const createGameScenarios = {
  /** 初期状態（ゲーム開始直後） */
  initial: () =>
    createMockGameState({
      game: { turn: 1, round: 1 },
    }),

  /** 中盤のゲーム状態 */
  midGame: () =>
    createMockGameState({
      players: {
        'player-1': createMockPlayer('player-1', {
          life: { current: 5, max: 7 },
          cp: { current: 6, max: 6 },
          field: [
            createMockUnit('unit-1', { bp: 6000, currentBP: 6000 }),
            createMockUnit('unit-2', { bp: 4000, currentBP: 4000, active: false }),
          ],
          hand: [createMockAtom('card-1'), createMockAtom('card-2')],
        }),
        'player-2': createMockPlayer('player-2', {
          life: { current: 4, max: 7 },
          cp: { current: 5, max: 6 },
          field: [createMockUnit('unit-3', { bp: 7000, currentBP: 7000 })],
        }),
      },
      game: { turn: 3, round: 5 },
    }),

  /** ユーザーのターン */
  myTurn: (playerId: string) =>
    createMockGameState({
      game: { turnPlayer: playerId },
    }),

  /** 相手のターン */
  opponentTurn: (playerId: string) =>
    createMockGameState({
      game: { turnPlayer: playerId === 'player-1' ? 'player-2' : 'player-1' },
    }),
};
