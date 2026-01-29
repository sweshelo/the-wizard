# TASK-1.1: AIモジュール基本構造

## ステータス: NOT_STARTED

## 概要

`/src/ai/` ディレクトリの基本構造を作成し、AIモジュールの土台を構築する。

## 前提条件

- TASK-1.0 (テスト環境構築) が完了していること

## 成果物

```
src/ai/
├── index.ts           # エクスポート
├── types.ts           # AI固有の型定義
└── constants.ts       # 設定値・定数
```

## TDDによる実装手順

### Step 1: テストケースのリストアップ

- [ ] モジュールがエクスポートを持つこと
- [ ] AIGameContext型が定義されていること
- [ ] CompactUnit型が定義されていること
- [ ] CompactCard型が定義されていること
- [ ] 定数が正しく定義されていること

### Step 2: Red - 最初のテストを書く

```typescript
// src/ai/index.test.ts
import { describe, it, expect } from 'bun:test';
import * as AIModule from './index';

describe('AI Module', () => {
  describe('exports', () => {
    it('should export types', () => {
      // 型は実行時に存在しないため、import文でエラーにならないことを確認
      expect(AIModule).toBeDefined();
    });
  });
});
```

```typescript
// src/ai/types.test.ts
import { describe, it, expect } from 'bun:test';
import type { AIGameContext, CompactUnit, CompactCard } from './types';

describe('AI Types', () => {
  it('should define AIGameContext type', () => {
    const context: AIGameContext = {
      turn: 1,
      round: 1,
      isMyTurn: true,
      self: {
        life: 7,
        cp: { current: 3, max: 3 },
        jokerGauge: 0,
        handCount: 5,
        deckCount: 35,
      },
      opponent: {
        life: 7,
        cp: { current: 3, max: 3 },
        jokerGauge: 0,
        handCount: 5,
        deckCount: 35,
      },
      myField: [],
      opponentField: [],
      myHand: [],
      myTrigger: [],
      recentEvents: [],
    };
    expect(context.turn).toBe(1);
  });
});
```

### Step 3: Green - 型定義を実装

```typescript
// src/ai/types.ts
export interface AIGameContext {
  turn: number;
  round: number;
  isMyTurn: boolean;
  self: PlayerResources;
  opponent: PlayerResources;
  myField: CompactUnit[];
  opponentField: CompactUnit[];
  myHand: CompactCard[];
  myTrigger: CompactCard[];
  recentEvents: string[];
}

export interface PlayerResources {
  life: number;
  cp: { current: number; max: number };
  jokerGauge: number;
  handCount: number;
  deckCount: number;
}

export interface CompactUnit {
  id: string;
  name: string;
  catalogId: string;
  bp: number;
  baseBp: number;
  cost: number;
  active: boolean;
  abilities: string[];
  canBoot: boolean;
}

export interface CompactCard {
  id: string;
  name: string;
  catalogId: string;
  cost: number;
  type: 'unit' | 'trigger' | 'intercept' | 'advanced_unit' | 'virus';
  playable: boolean;
}
```

### Step 4: 定数のテスト

```typescript
// src/ai/constants.test.ts
import { describe, it, expect } from 'bun:test';
import { AI_CONFIG, MODEL_CONFIG, TIMEOUT_CONFIG } from './constants';

describe('AI Constants', () => {
  it('should define AI_CONFIG', () => {
    expect(AI_CONFIG.COST_LIMIT_PER_GAME).toBeDefined();
    expect(AI_CONFIG.COMPLEXITY_THRESHOLD).toBeDefined();
  });

  it('should define MODEL_CONFIG', () => {
    expect(MODEL_CONFIG.HAIKU).toBeDefined();
    expect(MODEL_CONFIG.SONNET).toBeDefined();
    expect(MODEL_CONFIG.OPUS).toBeDefined();
  });

  it('should define TIMEOUT_CONFIG', () => {
    expect(TIMEOUT_CONFIG.NORMAL_OPERATION).toBeLessThan(60000);
    expect(TIMEOUT_CONFIG.CHOICE_RESPONSE).toBeLessThan(10000);
  });
});
```

### Step 5: 定数を実装

```typescript
// src/ai/constants.ts
export const AI_CONFIG = {
  COST_LIMIT_PER_GAME: 2.0,
  COMPLEXITY_THRESHOLD: 5,
  PERIODIC_ANALYSIS_ROUNDS: 2,
} as const;

export const MODEL_CONFIG = {
  HAIKU: 'claude-3-haiku-20240307',
  SONNET: 'claude-3-5-sonnet-20241022',
  OPUS: 'claude-3-opus-20240229',
} as const;

export const TIMEOUT_CONFIG = {
  NORMAL_OPERATION: 5000,
  CHOICE_RESPONSE: 8000,
  MULLIGAN: 8000,
  FALLBACK_WARNING: 1000,
} as const;
```

## Refactor

- 型定義の整理
- JSDoc コメントの追加
- エクスポートの整理

## 完了条件

- [ ] 全テストがパス
- [ ] `bun lint` がパス
- [ ] 型定義が正しく機能する
- [ ] 他のモジュールからimport可能

---

## 作業ログ

| 日時 | 内容 |
|------|------|
| - | - |

## 課題・メモ

- 型定義は `/src/submodule/suit/types/` の既存型と整合性を取ること
