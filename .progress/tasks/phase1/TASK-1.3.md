# TASK-1.3: 状態変換 (StateTranslator)

## ステータス: NOT_STARTED

## 概要

GameStateをAIGameContextに変換し、LLMに渡しやすい形式に整形する。

## 前提条件

- TASK-1.1 (AIモジュール基本構造) が完了していること

## 成果物

```
src/ai/
├── StateTranslator.ts       # 状態変換ロジック
├── StateTranslator.test.ts  # テスト
├── IdMapper.ts              # ID短縮マッピング
└── IdMapper.test.ts         # テスト
```

## TDDによる実装手順

### テストケースリスト

1. **基本情報の変換**
   - [ ] turn が正しく変換される
   - [ ] round が正しく変換される
   - [ ] isMyTurn が正しく判定される

2. **プレイヤーリソースの変換**
   - [ ] life が正しく変換される
   - [ ] cp (current/max) が正しく変換される
   - [ ] jokerGauge が正しく変換される
   - [ ] handCount が正しく計算される
   - [ ] deckCount が正しく計算される

3. **フィールド情報の変換**
   - [ ] myField が正しく変換される
   - [ ] opponentField が正しく変換される
   - [ ] CompactUnit の各プロパティが正しい

4. **手札情報の変換**
   - [ ] myHand が正しく変換される
   - [ ] playable が CP に基づいて正しく判定される

5. **ID短縮**
   - [ ] ユニットID が短縮される (u1, u2, ...)
   - [ ] カードID が短縮される (c1, c2, ...)
   - [ ] 短縮IDから元IDへの復元が可能

### Step 1: Red - 基本情報変換のテスト

```typescript
// src/ai/StateTranslator.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { translateGameState } from './StateTranslator';
import { createMockGameState } from '@/test/mocks/gameState';

describe('StateTranslator', () => {
  describe('translateGameState', () => {
    describe('basic info', () => {
      it('should convert turn number correctly', () => {
        const gameState = createMockGameState({
          game: { turn: 5, round: 2, turnPlayer: 'player-1', firstPlayer: 'player-1' }
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.turn).toBe(5);
      });

      it('should convert round number correctly', () => {
        const gameState = createMockGameState({
          game: { turn: 5, round: 3, turnPlayer: 'player-1', firstPlayer: 'player-1' }
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.round).toBe(3);
      });

      it('should identify when it is my turn', () => {
        const gameState = createMockGameState({
          game: { turn: 5, round: 2, turnPlayer: 'player-1', firstPlayer: 'player-1' }
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.isMyTurn).toBe(true);
      });

      it('should identify when it is not my turn', () => {
        const gameState = createMockGameState({
          game: { turn: 5, round: 2, turnPlayer: 'player-2', firstPlayer: 'player-1' }
        });

        const result = translateGameState(gameState, 'player-1');

        expect(result.isMyTurn).toBe(false);
      });
    });
  });
});
```

### Step 2: Green - 基本実装

```typescript
// src/ai/StateTranslator.ts
import type { AIGameContext, PlayerResources, CompactUnit, CompactCard } from './types';
import type { GameState } from '@/submodule/suit/types/game';

export function translateGameState(
  gameState: GameState,
  playerId: string
): AIGameContext {
  const { game, players } = gameState;
  const myPlayer = players?.[playerId];
  const opponentId = Object.keys(players ?? {}).find(id => id !== playerId);
  const opponentPlayer = opponentId ? players?.[opponentId] : undefined;

  return {
    turn: game.turn,
    round: game.round,
    isMyTurn: game.turnPlayer === playerId,
    self: translatePlayerResources(myPlayer),
    opponent: translatePlayerResources(opponentPlayer),
    myField: translateField(myPlayer?.field ?? []),
    opponentField: translateField(opponentPlayer?.field ?? []),
    myHand: translateHand(myPlayer?.hand ?? [], myPlayer?.cp.current ?? 0),
    myTrigger: translateTrigger(myPlayer?.trigger ?? []),
    recentEvents: [],
  };
}

function translatePlayerResources(player?: GameState['players'][string]): PlayerResources {
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
```

### Step 3: プレイヤーリソースのテスト追加

```typescript
describe('player resources', () => {
  it('should convert life correctly', () => {
    const gameState = createMockGameState({
      players: {
        'player-1': createMockPlayer('player-1', { life: { current: 5, max: 7 } }),
        'player-2': createMockPlayer('player-2'),
      }
    });

    const result = translateGameState(gameState, 'player-1');

    expect(result.self.life).toBe(5);
  });

  it('should convert CP correctly', () => {
    const gameState = createMockGameState({
      players: {
        'player-1': createMockPlayer('player-1', { cp: { current: 4, max: 7 } }),
        'player-2': createMockPlayer('player-2'),
      }
    });

    const result = translateGameState(gameState, 'player-1');

    expect(result.self.cp.current).toBe(4);
    expect(result.self.cp.max).toBe(7);
  });

  it('should calculate handCount from hand array length', () => {
    const gameState = createMockGameState({
      players: {
        'player-1': createMockPlayer('player-1', {
          hand: [createMockCard('card-1'), createMockCard('card-2'), createMockCard('card-3')]
        }),
        'player-2': createMockPlayer('player-2'),
      }
    });

    const result = translateGameState(gameState, 'player-1');

    expect(result.self.handCount).toBe(3);
  });
});
```

### Step 4: ID短縮のテスト

```typescript
// src/ai/IdMapper.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { IdMapper } from './IdMapper';

describe('IdMapper', () => {
  let mapper: IdMapper;

  beforeEach(() => {
    mapper = new IdMapper();
  });

  describe('shorten', () => {
    it('should shorten unit IDs to u1, u2, ...', () => {
      const shortened = mapper.shortenUnit('unit-abc123-def456');

      expect(shortened).toBe('u1');
    });

    it('should return same short ID for same original ID', () => {
      const first = mapper.shortenUnit('unit-abc123');
      const second = mapper.shortenUnit('unit-abc123');

      expect(first).toBe(second);
    });

    it('should shorten card IDs to c1, c2, ...', () => {
      const shortened = mapper.shortenCard('card-xyz789');

      expect(shortened).toBe('c1');
    });
  });

  describe('restore', () => {
    it('should restore original unit ID from short ID', () => {
      const originalId = 'unit-abc123-def456';
      const shortId = mapper.shortenUnit(originalId);

      const restored = mapper.restoreUnit(shortId);

      expect(restored).toBe(originalId);
    });

    it('should return undefined for unknown short ID', () => {
      const restored = mapper.restoreUnit('u999');

      expect(restored).toBeUndefined();
    });
  });
});
```

### Step 5: IdMapper の実装

```typescript
// src/ai/IdMapper.ts
export class IdMapper {
  private unitMap: Map<string, string> = new Map();
  private unitReverseMap: Map<string, string> = new Map();
  private cardMap: Map<string, string> = new Map();
  private cardReverseMap: Map<string, string> = new Map();
  private unitCounter = 0;
  private cardCounter = 0;

  shortenUnit(originalId: string): string {
    if (this.unitMap.has(originalId)) {
      return this.unitMap.get(originalId)!;
    }
    this.unitCounter++;
    const shortId = `u${this.unitCounter}`;
    this.unitMap.set(originalId, shortId);
    this.unitReverseMap.set(shortId, originalId);
    return shortId;
  }

  shortenCard(originalId: string): string {
    if (this.cardMap.has(originalId)) {
      return this.cardMap.get(originalId)!;
    }
    this.cardCounter++;
    const shortId = `c${this.cardCounter}`;
    this.cardMap.set(originalId, shortId);
    this.cardReverseMap.set(shortId, originalId);
    return shortId;
  }

  restoreUnit(shortId: string): string | undefined {
    return this.unitReverseMap.get(shortId);
  }

  restoreCard(shortId: string): string | undefined {
    return this.cardReverseMap.get(shortId);
  }

  reset(): void {
    this.unitMap.clear();
    this.unitReverseMap.clear();
    this.cardMap.clear();
    this.cardReverseMap.clear();
    this.unitCounter = 0;
    this.cardCounter = 0;
  }
}
```

## Refactor

- 関数の分離
- エラーハンドリングの追加
- ドキュメントコメントの追加

## 完了条件

- [ ] 全テストがパス（15-20 テストケース）
- [ ] `bun lint` がパス
- [ ] GameState → AIGameContext 変換が正しく動作
- [ ] ID短縮・復元が正しく動作

---

## 作業ログ

| 日時 | 内容 |
|------|------|
| - | - |

## 課題・メモ

- `/src/submodule/suit/types/` の型定義を参照すること
- カタログ情報の付与は TASK-2.1 で実装
