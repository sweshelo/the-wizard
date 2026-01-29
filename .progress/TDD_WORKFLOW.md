# TDD (テスト駆動開発) ワークフローガイド

## 概要

本プロジェクトでは、t-wada氏が提唱するテスト駆動開発 (TDD) を採用します。
TDDは「動作するきれいなコード」を目指す開発手法です。

## TDDの基本サイクル: Red-Green-Refactor

```
    ┌─────────────────────────────────────────────┐
    │                                             │
    │   ┌───────┐     ┌───────┐     ┌──────────┐ │
    │   │  Red  │────▶│ Green │────▶│ Refactor │ │
    │   └───────┘     └───────┘     └──────────┘ │
    │       ▲                              │      │
    │       └──────────────────────────────┘      │
    │                                             │
    └─────────────────────────────────────────────┘
```

### 1. Red (レッド) - 失敗するテストを書く

**目的:** 実装すべき振る舞いを明確にする

- 実装前に、期待する振る舞いをテストとして記述
- テストを実行し、**必ず失敗することを確認**
- 失敗理由が期待通りであることを確認

```typescript
// 例: StateTranslator のテスト
describe('StateTranslator', () => {
  it('should convert GameState to AIGameContext', () => {
    const gameState = createMockGameState();
    const result = translateGameState(gameState, 'player-1');

    expect(result.turn).toBe(5);
    expect(result.isMyTurn).toBe(true);
    expect(result.self.life).toBe(6);
  });
});
```

### 2. Green (グリーン) - テストを通す最小限のコードを書く

**目的:** テストを通すことだけに集中する

- **最小限**のコードでテストを通す
- きれいさ、効率は後回し
- 「動く」ことを優先

```typescript
// 最小限の実装
export function translateGameState(
  gameState: GameState,
  playerId: string
): AIGameContext {
  return {
    turn: gameState.game.turn,
    isMyTurn: gameState.game.turnPlayer === playerId,
    self: {
      life: gameState.players?.[playerId]?.life.current ?? 0,
      // ... 最小限の実装
    },
    // ...
  };
}
```

### 3. Refactor (リファクタ) - コードを整理する

**目的:** テストが通った状態を維持しながら、コードを改善

- 重複を除去
- 命名を改善
- 構造を整理
- **テストは常に通っている状態を維持**

---

## TDDの原則

### 1. 仮実装 (Fake It)

テストを通すために、まずハードコードされた値を返す。
その後、段階的に本物の実装に置き換える。

```typescript
// 仮実装
function calculateComplexityScore(): number {
  return 5; // まずは固定値で
}

// 本物の実装へ段階的に
function calculateComplexityScore(state: GameState): number {
  let score = 0;
  // 実際のロジック
  return score;
}
```

### 2. 三角測量 (Triangulation)

複数のテストケースから、一般的な実装を導き出す。

```typescript
it('should return 0 for empty field', () => {
  expect(calculateComplexityScore(emptyState)).toBe(0);
});

it('should return higher score for more units', () => {
  expect(calculateComplexityScore(stateWith3Units)).toBeGreaterThan(
    calculateComplexityScore(stateWith1Unit)
  );
});
```

### 3. 明白な実装 (Obvious Implementation)

実装が明白な場合は、直接書いても良い。
ただし、テストが失敗したら仮実装に戻る。

---

## プロジェクト固有のTDDガイドライン

### テストファイル配置

```
src/
├── ai/
│   ├── StateTranslator.ts
│   ├── StateTranslator.test.ts      # 同じディレクトリに配置
│   ├── Heuristics.ts
│   └── Heuristics.test.ts
└── ...
```

### テストの命名規則

```typescript
describe('モジュール名', () => {
  describe('関数名/メソッド名', () => {
    it('should [期待する振る舞い] when [条件]', () => {
      // ...
    });
  });
});
```

### テストの構造 (AAA パターン)

```typescript
it('should return correct CP when player has resources', () => {
  // Arrange - 準備
  const gameState = createMockGameState({
    players: {
      'player-1': { cp: { current: 4, max: 7 } }
    }
  });

  // Act - 実行
  const result = translateGameState(gameState, 'player-1');

  // Assert - 検証
  expect(result.self.cp.current).toBe(4);
  expect(result.self.cp.max).toBe(7);
});
```

---

## タスク実行時のTDDフロー

### 各タスク開始時

1. **要件の理解**: タスクの要件を完全に理解する
2. **テストリストの作成**: 実装すべきテストケースをリストアップ
3. **優先順位付け**: 最も簡単なテストから開始

### 実装サイクル

```
[ ] テストを1つ書く
[ ] テストが失敗することを確認 (Red)
[ ] 最小限のコードを書く
[ ] テストが通ることを確認 (Green)
[ ] リファクタリング
[ ] 全テストが通ることを確認
[ ] 次のテストへ
```

### コミット粒度

- **Red→Green**: 1テストケースごとにコミット可能
- **Refactor**: リファクタリング完了時にコミット
- コミットメッセージには、どのテストを追加/修正したか記載

---

## テスト環境セットアップ

### 必要なパッケージ

```bash
bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom
```

### vitest設定 (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/ai/**/*.ts'],
    },
  },
});
```

### テスト実行コマンド

```bash
# テスト実行
bun test

# ウォッチモード
bun test --watch

# カバレッジ
bun test --coverage

# 特定ファイルのみ
bun test StateTranslator
```

---

## モックの活用

### WebSocket モック

```typescript
// src/test/mocks/websocket.ts
export const createMockWebSocket = () => ({
  send: vi.fn(),
  request: vi.fn(),
  onMessage: vi.fn(),
});
```

### GameState モック

```typescript
// src/test/mocks/gameState.ts
export const createMockGameState = (
  overrides?: Partial<GameState>
): GameState => ({
  game: {
    turn: 1,
    round: 1,
    turnPlayer: 'player-1',
    firstPlayer: 'player-1',
  },
  players: {
    'player-1': createMockPlayer('player-1'),
    'player-2': createMockPlayer('player-2'),
  },
  rule: createMockRule(),
  ...overrides,
});
```

### Claude API モック

```typescript
// src/test/mocks/claude.ts
export const createMockClaudeClient = () => ({
  complete: vi.fn().mockResolvedValue({
    content: [{ text: '{"action": "UnitDrive", ...}' }],
  }),
});
```

---

## TDDアンチパターン

### 避けるべきこと

1. **テスト後付け**: 実装後にテストを書く
2. **テストの無視**: Red を確認せずに実装を始める
3. **大きなステップ**: 一度に多くの機能を実装しようとする
4. **リファクタリングのスキップ**: Green で満足してしまう
5. **テストのためのテスト**: 意味のないテストを増やす

### 守るべきこと

1. **小さなステップ**: 1つの振る舞いに集中
2. **常にテストを実行**: 変更後は必ずテスト
3. **Red を確認**: テストが正しく失敗することを確認
4. **リファクタリングは勇気**: テストがあるから安心して改善

---

## 参考資料

- [t-wada のTDD入門](https://speakerdeck.com/twada)
- [テスト駆動開発 (Kent Beck著)](https://www.amazon.co.jp/dp/4274217884)
- [Vitest Documentation](https://vitest.dev/)
