'use client';

import { DEFAULT_ROOM_SETTINGS } from '@/constants/room';
import type { IPlayer, Rule } from '@/submodule/suit/types';
import { create } from 'zustand';

// ステートの型定義
export interface GameState {
  players?: {
    [key: string]: IPlayer;
  };
  game: {
    turn: number;
    round: number;
    turnPlayer: IPlayer['id'];
    firstPlayer: IPlayer['id'];
  };
  rule: Rule;
}

// 初期状態
const initialState: GameState = {
  players: undefined,
  game: {
    turn: 0,
    round: 0,
    turnPlayer: '',
    firstPlayer: '',
  },
  rule: DEFAULT_ROOM_SETTINGS.rule,
};

export const useGameStore = create<
  GameState & {
    sync: (newState: Partial<GameState>) => void;
  }
>(set => ({
  ...initialState,
  sync: newState =>
    set(store => ({
      ...store,
      ...newState,
    })),
}));
