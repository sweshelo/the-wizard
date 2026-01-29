# エージェント作業ガイド

## 概要

このドキュメントは、AI Client 実装を担当するエージェントのための作業ガイドです。

---

## 作業開始前の確認事項

### 1. 環境確認

```bash
# 依存関係のインストール
bun install

# 開発サーバーが起動できることを確認
bun dev

# Lintが通ることを確認
bun lint
```

### 2. 関連ドキュメントの確認

必ず以下のドキュメントを読んでから作業を開始すること:

- [ ] `/CLAUDE.md` - プロジェクト概要
- [ ] `/docs/AI_CLIENT_REQUIREMENTS.md` - 要件定義書
- [ ] `/docs/AI_CHAT_UI_REQUIREMENTS.md` - Chat UI仕様書
- [ ] `/.progress/TDD_WORKFLOW.md` - TDDワークフロー
- [ ] 担当タスクのOVERVIEW.md

### 3. 現在の進捗確認

```bash
# 現在の進捗状況を確認
cat .progress/CURRENT_STATUS.md
```

---

## 作業フロー

### Step 1: タスクの選択と宣言

1. `/.progress/tasks/phaseX/OVERVIEW.md` を確認
2. 「NOT_STARTED」かつ依存関係が解決されたタスクを選択
3. 進捗ファイルを作成し、ステータスを「IN_PROGRESS」に更新

```markdown
<!-- /.progress/tasks/phase1/TASK-1.1.md -->
# TASK-1.1: AIモジュール基本構造

## ステータス: IN_PROGRESS

## 開始日時: 2026-01-29 10:00

## 担当エージェント: Claude-XXXX
```

### Step 2: TDDによる実装

**必ずTDDワークフローに従うこと**

```
1. テストケースをリストアップ
2. 最も簡単なテストから開始
3. Red → Green → Refactor サイクルを繰り返す
4. 各サイクル完了時にコミット
```

### Step 3: 進捗の更新

作業中は定期的に進捗ファイルを更新:

```markdown
## 実装済みテストケース

- [x] 基本的なディレクトリ構造の作成
- [x] index.ts エクスポートファイル
- [ ] AIController クラスの基本実装

## 課題・ブロッカー

- なし

## 次のアクション

- AIController の型定義を作成
```

### Step 4: 完了報告

1. 全テストが通ることを確認
2. `bun lint` が通ることを確認
3. 進捗ファイルのステータスを「COMPLETED」に更新
4. `CURRENT_STATUS.md` を更新

---

## コード規約

### TypeScript

プロジェクトは厳格なTypeScriptルールを採用:

- `any` 禁止
- `ts-ignore` 禁止
- 非nullアサーション (`!`) 禁止
- 型のみのインポートは `import type` を使用
- 未使用変数は `_` プレフィックス

### ファイル命名

```
src/ai/
├── index.ts                    # エクスポート (キャメルケース)
├── AIController.ts             # クラス (パスカルケース)
├── AIController.test.ts        # テスト (*.test.ts)
├── types.ts                    # 型定義
└── constants.ts                # 定数
```

### コミットメッセージ

```
feat(ai): add StateTranslator basic implementation

- Add translateGameState function
- Add tests for basic conversion
- Add mock game state helpers

TDD: Red→Green for GameState conversion
```

---

## テスト作成ガイドライン

### テストファイルの配置

実装ファイルと同じディレクトリに配置:

```
src/ai/StateTranslator.ts
src/ai/StateTranslator.test.ts
```

### テストの構造

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { translateGameState } from './StateTranslator';
import { createMockGameState } from '@/test/mocks/gameState';

describe('StateTranslator', () => {
  describe('translateGameState', () => {
    it('should convert turn number correctly', () => {
      // Arrange
      const gameState = createMockGameState({ game: { turn: 5 } });

      // Act
      const result = translateGameState(gameState, 'player-1');

      // Assert
      expect(result.turn).toBe(5);
    });

    it('should identify current player turn', () => {
      const gameState = createMockGameState({
        game: { turnPlayer: 'player-1' }
      });

      const result = translateGameState(gameState, 'player-1');

      expect(result.isMyTurn).toBe(true);
    });
  });
});
```

### モックの使用

```typescript
// 共通モックは /src/test/mocks/ に配置
import { createMockGameState } from '@/test/mocks/gameState';
import { createMockWebSocket } from '@/test/mocks/websocket';
import { createMockClaudeClient } from '@/test/mocks/claude';
```

---

## トラブルシューティング

### テストが失敗する場合

1. エラーメッセージを確認
2. 期待値と実際の値を比較
3. モックが正しく設定されているか確認
4. 依存関係が正しくインポートされているか確認

### Lintエラーの場合

```bash
# 自動修正を試す
bun lint --fix

# 残るエラーは手動で修正
```

### 型エラーの場合

1. `@/submodule/suit/types/` の型定義を確認
2. オプショナルプロパティの扱いを確認 (`?.` を使用)
3. 型ガードを適切に使用

---

## 依存関係マトリクス

### Phase 1 タスク依存関係

```
TASK-1.1 (AIモジュール基本構造)
    └── TASK-1.2 (WebSocketインターセプト)
    └── TASK-1.3 (状態変換)
           └── TASK-1.8 (盤面複雑性評価)

TASK-1.4 (ヒューリスティック)
    └── TASK-1.5 (Claude API統合)
           └── TASK-1.6 (基本プロンプト)

TASK-1.7 (Chat UI基本実装) ← 独立して進行可能
```

---

## チェックリスト

### タスク開始時

- [ ] 関連ドキュメントを読んだ
- [ ] 依存タスクが完了していることを確認
- [ ] 進捗ファイルを作成し、IN_PROGRESSに更新
- [ ] テストケースをリストアップした

### 実装中

- [ ] TDDサイクル (Red→Green→Refactor) を遵守
- [ ] 各サイクル完了時にコミット
- [ ] 進捗ファイルを定期的に更新

### タスク完了時

- [ ] 全テストがパス
- [ ] `bun lint` がパス
- [ ] 進捗ファイルをCOMPLETEDに更新
- [ ] CURRENT_STATUS.mdを更新
- [ ] プルリクエスト作成（必要な場合）

---

## 連絡事項

### ブロッカーが発生した場合

進捗ファイルに記載し、ステータスを「BLOCKED」に変更:

```markdown
## ステータス: BLOCKED

## ブロッカー

- 外部依存: the-fool サーバーのAPI仕様が不明確
- 対応策: Issue #XX で問い合わせ中
```

### 設計変更が必要な場合

1. 現在の進捗ファイルに「設計変更提案」セクションを追加
2. 変更理由と影響範囲を明記
3. レビューを依頼
