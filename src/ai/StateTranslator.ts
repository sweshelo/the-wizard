// src/ai/StateTranslator.ts
import type { GameState } from '@/hooks/game/context';
import type { IUnit, ICard, IAtom, IPlayer } from '@/submodule/suit/types';
import type { AIGameContext, PlayerResources, CompactUnit, CompactCard } from './types';
import { IdMapper } from './IdMapper';
import catalog from '@/submodule/suit/catalog/catalog';

/**
 * GameStateをAIGameContextに変換した結果
 */
export interface TranslationResult {
  /** 変換されたAIGameContext */
  context: AIGameContext;
  /** 使用したIdMapper（ID復元に使用） */
  mapper: IdMapper;
}

/**
 * GameStateをAIGameContextに変換する
 * @param gameState ゲーム状態
 * @param playerId 自プレイヤーのID
 * @param existingMapper 既存のIdMapper（オプション）
 * @returns 変換結果
 */
export function translateGameState(
  gameState: GameState,
  playerId: string,
  existingMapper?: IdMapper
): TranslationResult {
  const mapper = existingMapper ?? new IdMapper();
  const { game, players } = gameState;
  const myPlayer = players?.[playerId];
  const opponentId = Object.keys(players ?? {}).find(id => id !== playerId);
  const opponentPlayer = opponentId ? players?.[opponentId] : undefined;

  const currentCp = myPlayer?.cp.current ?? 0;

  const context: AIGameContext = {
    turn: game.turn,
    round: game.round,
    isMyTurn: game.turnPlayer === playerId,
    self: translatePlayerResources(myPlayer),
    opponent: translatePlayerResources(opponentPlayer),
    myField: translateField(myPlayer?.field ?? [], mapper),
    opponentField: translateField(opponentPlayer?.field ?? [], mapper),
    myHand: translateHand(myPlayer?.hand ?? [], currentCp, mapper),
    myTrigger: translateTrigger(myPlayer?.trigger ?? [], mapper),
    recentEvents: [],
  };

  return { context, mapper };
}

/**
 * プレイヤーリソースを変換
 */
function translatePlayerResources(player: IPlayer | undefined): PlayerResources {
  return {
    life: player?.life.current ?? 0,
    cp: {
      current: player?.cp.current ?? 0,
      max: player?.cp.max ?? 0,
    },
    jokerGauge: player?.joker.gauge ?? 0,
    handCount: player?.hand.length ?? 0,
    deckCount: player?.deck.length ?? 0,
  };
}

/**
 * フィールドユニットを変換
 */
function translateField(units: IUnit[], mapper: IdMapper): CompactUnit[] {
  return units.map(unit => {
    const catalogInfo = catalog.get(unit.catalogId);
    return {
      id: mapper.shortenUnit(unit.id),
      name: catalogInfo?.name ?? 'Unknown',
      catalogId: unit.catalogId,
      bp: unit.currentBP,
      baseBp: unit.bp,
      cost: catalogInfo?.cost ?? 0,
      active: unit.active,
      abilities: extractAbilities(unit),
      canBoot: unit.hasBootAbility === true && !unit.isBooted,
    };
  });
}

/**
 * ユニットから能力名リストを抽出
 */
function extractAbilities(unit: IUnit): string[] {
  const abilities: string[] = [];

  // deltaから能力を抽出
  if (unit.delta) {
    for (const delta of unit.delta) {
      if (delta.effect.type === 'keyword') {
        abilities.push(delta.effect.name);
      }
    }
  }

  return abilities;
}

/**
 * 手札を変換
 */
function translateHand(hand: IAtom[], currentCp: number, mapper: IdMapper): CompactCard[] {
  return hand.map(atom => {
    const card = atom as ICard;
    const catalogInfo = catalog.get(card.catalogId);
    const cost = card.currentCost ?? catalogInfo?.cost ?? 0;
    return {
      id: mapper.shortenCard(card.id),
      name: catalogInfo?.name ?? 'Unknown',
      catalogId: card.catalogId ?? '',
      cost,
      type: catalogInfo?.type ?? 'unit',
      playable: cost <= currentCp,
    };
  });
}

/**
 * トリガーゾーンを変換
 */
function translateTrigger(trigger: IAtom[], mapper: IdMapper): CompactCard[] {
  return trigger.map(atom => {
    const card = atom as ICard;
    const catalogInfo = catalog.get(card.catalogId);
    return {
      id: mapper.shortenCard(card.id),
      name: catalogInfo?.name ?? 'Unknown',
      catalogId: card.catalogId ?? '',
      cost: catalogInfo?.cost ?? 0,
      type: catalogInfo?.type ?? 'trigger',
      playable: false, // トリガーは手動でプレイしない
    };
  });
}

/**
 * StateTranslatorインスタンスを作成
 * IdMapperを内部で保持し、連続した変換で一貫したIDマッピングを提供
 */
export function createStateTranslator(): {
  translate: (gameState: GameState, playerId: string) => TranslationResult;
  reset: () => void;
  restoreUnit: (shortId: string) => string | undefined;
  restoreCard: (shortId: string) => string | undefined;
} {
  const mapper = new IdMapper();

  return {
    translate: (gameState: GameState, playerId: string) => {
      return translateGameState(gameState, playerId, mapper);
    },
    reset: () => {
      mapper.reset();
    },
    restoreUnit: (shortId: string) => mapper.restoreUnit(shortId),
    restoreCard: (shortId: string) => mapper.restoreCard(shortId),
  };
}
