# Phase 3: 高度な機能

## 目標

長期戦対応、学習機能、バックグラウンド分析の実装

## 前提条件

- Phase 2 が完了していること

## タスク一覧

| タスクID | タスク名                       | 優先度 | 依存関係 | ステータス |
| -------- | ------------------------------ | ------ | -------- | ---------- |
| 3.1      | コンテキスト管理               | P0     | Phase 2  | COMPLETED  |
| 3.2      | 世代管理による陳腐化検出       | P0     | 3.1      | COMPLETED  |
| 3.3      | デッキ認識・戦略適応           | P0     | 3.2      | COMPLETED  |
| 3.4      | コンボ検出・記録               | P1     | 3.3      | COMPLETED  |
| 3.5      | 定期分析 (2ラウンドごと、Opus) | P0     | 3.2      | COMPLETED  |
| 3.6      | 相手捨札傾向分析               | P1     | 3.5      | COMPLETED  |
| 3.7      | バックグラウンド推論           | P1     | 3.5      | COMPLETED  |
| 3.8      | 知識ストレージ (LocalStorage)  | P2     | 3.4      | COMPLETED  |

## 依存関係図

```
Phase 2 完了
    │
    └──▶ TASK-3.1 (コンテキスト管理)
           │
           └──▶ TASK-3.2 (世代管理)
                   │
                   ├──▶ TASK-3.3 (デッキ認識・戦略適応)
                   │       │
                   │       └──▶ TASK-3.4 (コンボ検出・記録)
                   │               │
                   │               └──▶ TASK-3.8 (知識ストレージ)
                   │
                   └──▶ TASK-3.5 (定期分析)
                           │
                           ├──▶ TASK-3.6 (相手捨札傾向分析)
                           │
                           └──▶ TASK-3.7 (バックグラウンド推論)
```

---

## 詳細タスク

### TASK-3.1: コンテキスト管理 (スライディングウィンドウ)

**目的:** 長期戦でのコンテキストウィンドウ管理

**成果物:**

- `/src/ai/thread/ContextWindowManager.ts`
- `/src/ai/thread/ThreadSummarizer.ts`

**テストケース (TDD):**

1. 古いメッセージの要約
2. トークン数の推定
3. コンテキスト圧縮

---

### TASK-3.2: 世代管理による陳腐化検出

**目的:** 古くなった情報の検出と更新

**成果物:**

- `/src/ai/context/GenerationManager.ts`

**テストケース (TDD):**

1. 世代番号の付与
2. 陳腐化判定
3. 更新トリガー

---

### TASK-3.3: デッキ認識・戦略適応

**目的:** 相手デッキタイプの推定と戦略調整

**成果物:**

- `/src/ai/analysis/DeckRecognizer.ts`
- `/src/ai/analysis/StrategyAdapter.ts`

**テストケース (TDD):**

1. 公開カードからのデッキタイプ推定
2. 推定確度の計算
3. 戦略調整の生成

---

### TASK-3.4: コンボ検出・記録

**目的:** 相手のプレイパターンからコンボを検出

**成果物:**

- `/src/ai/knowledge/ComboDetector.ts`
- `/src/ai/knowledge/SynergyDetector.ts`

**テストケース (TDD):**

1. 連続効果発動の検出
2. コンボパターンの記録
3. 警戒通知の生成

---

### TASK-3.5: 定期分析 (2ラウンドごと、Opus)

**目的:** 定期的な深い戦略分析

**成果物:**

- `/src/ai/thread/PeriodicThread.ts`
- `/src/ai/BackgroundAnalyzer.ts`
- `/src/ai/prompts/periodic.ts`

**テストケース (TDD):**

1. 2ラウンドごとのトリガー
2. 分析結果の生成
3. メインスレッドへの戦略注入

---

### TASK-3.6: 相手捨札傾向分析

**目的:** 捨札から相手の戦略を分析

**成果物:**

- `/src/ai/analysis/TrashAnalyzer.ts`

**テストケース (TDD):**

1. 捨札からの傾向抽出
2. 未使用キーカードの推定
3. 警戒すべきカードのリスト化

---

### TASK-3.7: バックグラウンド推論

**目的:** ゲーム進行と並行した分析

**成果物:**

- `/src/ai/BackgroundRunner.ts`

**テストケース (TDD):**

1. メインスレッドと独立した実行
2. 結果の非同期取得
3. キャンセル処理

---

### TASK-3.8: 知識ストレージ (LocalStorage)

**目的:** 学習した知識の永続化

**成果物:**

- `/src/ai/knowledge/KnowledgeStore.ts`
- `/src/ai/knowledge/KnowledgeIndex.ts`
- `/src/ai/knowledge/ImportanceIndex.ts`
- `/src/ai/knowledge/RecursiveRetriever.ts`

**テストケース (TDD):**

1. 知識エントリの保存
2. インデックス検索
3. 重み付き再帰取得
4. 古いエントリの削除

---

## 完了条件

- [ ] 全タスクのステータスが COMPLETED
- [ ] 全テストがパス
- [ ] 長期戦（20ターン以上）でも安定動作
- [ ] 相手デッキタイプが推定・表示される
- [ ] 定期分析がバックグラウンドで実行される
- [ ] 学習した知識が次回ゲームに活用される
