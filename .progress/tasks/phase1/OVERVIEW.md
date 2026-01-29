# Phase 1: 基盤構築 (MVP)

## 目標

動作するAIプレイヤーの最小実装

## MVP定義

- マリガン対応
- ユニット召喚
- ターンエンド
- 基本的な選択応答
- AI思考内容のChat UI表示

## タスク一覧

| タスクID | タスク名 | 優先度 | 依存関係 | ステータス |
|----------|----------|--------|----------|------------|
| 1.0 | テスト環境構築 | P0 | なし | NOT_STARTED |
| 1.1 | AIモジュール基本構造 | P0 | 1.0 | NOT_STARTED |
| 1.2 | WebSocketインターセプト | P0 | 1.1 | NOT_STARTED |
| 1.3 | 状態変換 (StateTranslator) | P0 | 1.1 | NOT_STARTED |
| 1.4 | ヒューリスティック | P0 | 1.1 | NOT_STARTED |
| 1.5 | Claude API統合 | P0 | 1.4 | NOT_STARTED |
| 1.6 | 基本プロンプト | P0 | 1.5 | NOT_STARTED |
| 1.7 | Chat UI基本実装 | P1 | 1.1 | NOT_STARTED |
| 1.8 | 盤面複雑性評価 | P1 | 1.3 | NOT_STARTED |

## 依存関係図

```
TASK-1.0 (テスト環境構築)
    │
    └──▶ TASK-1.1 (AIモジュール基本構造)
           │
           ├──▶ TASK-1.2 (WebSocketインターセプト)
           │
           ├──▶ TASK-1.3 (状態変換)
           │       │
           │       └──▶ TASK-1.8 (盤面複雑性評価)
           │
           ├──▶ TASK-1.4 (ヒューリスティック)
           │       │
           │       └──▶ TASK-1.5 (Claude API統合)
           │               │
           │               └──▶ TASK-1.6 (基本プロンプト)
           │
           └──▶ TASK-1.7 (Chat UI基本実装) ← 並行作業可能
```

## 推定作業量

| タスクID | 推定工数 | テストケース数(概算) |
|----------|----------|---------------------|
| 1.0 | 2h | 設定確認のみ |
| 1.1 | 3h | 5-8 |
| 1.2 | 4h | 8-12 |
| 1.3 | 6h | 15-20 |
| 1.4 | 4h | 10-15 |
| 1.5 | 4h | 8-12 |
| 1.6 | 3h | 5-8 |
| 1.7 | 6h | 10-15 |
| 1.8 | 3h | 8-10 |

---

## 詳細タスク

### TASK-1.0: テスト環境構築

**ファイル:** [TASK-1.0.md](./TASK-1.0.md)

**目的:** Bun組み込みテストランナーによるテスト環境のセットアップ

**成果物:**
- `bunfig.toml` (テスト設定)
- `src/test/setup.ts`
- `src/test/mocks/` ディレクトリ (Anthropic APIモック含む)

---

### TASK-1.1: AIモジュール基本構造

**ファイル:** [TASK-1.1.md](./TASK-1.1.md)

**目的:** `/src/ai/` ディレクトリの基本構造を作成

**成果物:**
- `/src/ai/index.ts`
- `/src/ai/types.ts`
- `/src/ai/constants.ts`

**テストケース:**
1. モジュールが正しくエクスポートされること
2. 型定義が正しく機能すること

---

### TASK-1.2: WebSocketインターセプト

**ファイル:** [TASK-1.2.md](./TASK-1.2.md)

**目的:** WebSocketメッセージをインターセプトし、AIモジュールにルーティング

**成果物:**
- `/src/ai/AIController.ts`

**テストケース:**
1. AIモード有効時にメッセージがインターセプトされること
2. AIモード無効時は通常通り処理されること
3. 各イベントタイプが正しくルーティングされること
4. タイムアウト管理が機能すること

---

### TASK-1.3: 状態変換 (StateTranslator)

**ファイル:** [TASK-1.3.md](./TASK-1.3.md)

**目的:** GameStateをAIGameContextに変換

**成果物:**
- `/src/ai/StateTranslator.ts`
- `/src/ai/IdMapper.ts`

**テストケース:**
1. 基本情報（turn, round, isMyTurn）の変換
2. プレイヤー情報（life, cp, jokerGauge）の変換
3. フィールド情報の変換
4. 手札情報の変換
5. ID短縮マッピング

---

### TASK-1.4: ヒューリスティック

**ファイル:** [TASK-1.4.md](./TASK-1.4.md)

**目的:** API障害時のフォールバック用ルールベース判断

**成果物:**
- `/src/ai/Heuristics.ts`

**テストケース:**
1. マリガン判断（コスト分布に基づく）
2. ユニット召喚優先順位
3. ブロック判断（BP比較）
4. ターンエンド判断

---

### TASK-1.5: Claude API統合

**ファイル:** [TASK-1.5.md](./TASK-1.5.md)

**目的:** Claude APIクライアントの実装

**成果物:**
- `/src/ai/LLMClient.ts`

**テストケース:**
1. Haiku/Sonnet/Opus モデルの切り替え
2. タイムアウト処理
3. レスポンスのパース
4. エラーハンドリング
5. リトライ機構

---

### TASK-1.6: 基本プロンプト

**ファイル:** [TASK-1.6.md](./TASK-1.6.md)

**目的:** AIへの基本プロンプトテンプレート

**成果物:**
- `/src/ai/prompts/system.ts`
- `/src/ai/prompts/mulligan.ts`
- `/src/ai/prompts/action.ts`
- `/src/ai/prompts/choice.ts`

**テストケース:**
1. プロンプトが正しく生成されること
2. ゲーム状態が正しく埋め込まれること

---

### TASK-1.7: Chat UI基本実装

**ファイル:** [TASK-1.7.md](./TASK-1.7.md)

**目的:** AI推論可視化用のチャットUI

**成果物:**
- `/src/components/ai/AIChat.tsx`
- `/src/components/ai/AIChatMessageList.tsx`
- `/src/components/ai/AIChatMessage.tsx`
- `/src/components/ai/hooks/useAIChatStore.ts`

**テストケース:**
1. メッセージの追加・表示
2. 表示/非表示の切り替え
3. 自動スクロール
4. モデルバッジ表示

---

### TASK-1.8: 盤面複雑性評価

**ファイル:** [TASK-1.8.md](./TASK-1.8.md)

**目的:** 盤面の複雑性を評価し、Opus使用判断に活用

**成果物:**
- `/src/ai/ComplexityEvaluator.ts`

**テストケース:**
1. 空盤面のスコア = 0
2. ユニット数に応じたスコア増加
3. 特殊能力によるスコア増加
4. 閾値判定

---

## 完了条件

- [ ] 全タスクのステータスが COMPLETED
- [ ] 全テストがパス
- [ ] `bun lint` がパス
- [ ] AIがマリガン〜ターンエンドまで自動操作可能
- [ ] Chat UIにAI思考が表示される
