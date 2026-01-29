import { useGameStore } from './context';
import { useShallow } from 'zustand/shallow';
import { LocalStorageHelper } from '@/service/local-storage';
import type { PlayerTheme } from '@/helper/color';
import { themeColors } from '@/helper/color';

export const usePlayer = (playerId: string) => {
  const [player] = useGameStore(useShallow(state => [state.players?.[playerId]]));
  return player;
};

export const useField = (playerId: string) => {
  const [field] = useGameStore(useShallow(state => [state.players?.[playerId]?.field]));
  return field;
};

export const useHand = (playerId: string) => {
  const [hand] = useGameStore(useShallow(state => [state.players?.[playerId]?.hand]));
  return hand;
};

export const useDeck = (playerId: string) => {
  const [deck] = useGameStore(useShallow(state => [state.players?.[playerId]?.deck]));
  return deck;
};

export const useTrash = (playerId: string) => {
  const [trash] = useGameStore(useShallow(state => [state.players?.[playerId]?.trash]));
  return trash;
};

export const useTrigger = (playerId: string) => {
  const [trigger] = useGameStore(useShallow(state => [state.players?.[playerId]?.trigger]));
  return trigger;
};

export const useRule = () => {
  const [rule] = useGameStore(useShallow(state => [state.rule]));
  return rule;
};

export const usePlayers = () => {
  const [players] = useGameStore(useShallow(state => [state.players]));
  return players;
};

// 現在のターンプレイヤーIDを取得
export const useTurnPlayer = () => {
  const [turnPlayer] = useGameStore(useShallow(state => [state.game.turnPlayer]));
  return turnPlayer;
};

// 先行プレイヤーIDを取得
export const useFirstPlayer = () => {
  const [firstPlayer] = useGameStore(useShallow(state => [state.game.firstPlayer]));
  return firstPlayer;
};

// 自分が先行か後攻かを判定 -> 'first' | 'second'
export const useSelfTurnOrder = (): PlayerTheme => {
  const firstPlayer = useFirstPlayer();
  const selfId = LocalStorageHelper.playerId();
  if (!firstPlayer) return 'first'; // ゲーム開始前のデフォルト
  return selfId === firstPlayer ? 'first' : 'second';
};

// 自分のテーマカラーを取得
export const useSelfTheme = () => {
  const turnOrder = useSelfTurnOrder();
  return themeColors[turnOrder];
};

// 相手が先行か後攻かを判定 -> 'first' | 'second'
export const useOpponentTurnOrder = (): PlayerTheme => {
  const selfTurnOrder = useSelfTurnOrder();
  return selfTurnOrder === 'first' ? 'second' : 'first';
};

// 相手のテーマカラーを取得
export const useOpponentTheme = () => {
  const turnOrder = useOpponentTurnOrder();
  return themeColors[turnOrder];
};

// 自分のターンかどうかを判定
export const useIsMyTurn = () => {
  const turnPlayer = useTurnPlayer();
  const selfId = LocalStorageHelper.playerId();
  return selfId === turnPlayer;
};
