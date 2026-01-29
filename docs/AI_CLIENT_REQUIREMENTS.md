# CODE OF JOKER AI Client 要件定義書

**バージョン:** 1.1
**作成日:** 2026-01-29
**更新日:** 2026-01-29
**ステータス:** ドラフト (Opus戦略更新)

---

## 1. エグゼクティブサマリー

### 1.1 目的

本プロジェクトは、CODE OF JOKER (COJ) のWebUIクライアント「the-wizard」に、Claude APIを活用したAI対戦機能を追加することを目的とする。

### 1.2 現状分析

#### 技術スタック（実際のコードベース）
| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | Next.js (App Router) | 15.x |
| UI | React | 19.x |
| 状態管理 | Zustand | 5.x |
| アニメーション | Framer Motion | 12.x |
| ランタイム | Bun | - |
| 型定義 | TypeScript | 5.9 |

#### アーキテクチャ概要
```
┌─────────────────────────────────────────────────────────────┐
│                     the-wizard (本リポジトリ)                 │
│                      Next.js WebUIクライアント                │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Feature/ │  │ hooks/   │  │component/│  │   service/   │ │
│  │ (17個)   │  │ game/    │  │  ui/     │  │ websocket.ts │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ WebSocket (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      the-fool (外部サーバー)                  │
│                    ゲームロジック・状態管理                    │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 重要な発見事項

1. **ゲームロジックはサーバー側**: 全てのゲームルール処理は「the-fool」サーバーで実行
2. **クライアントはUI専用**: the-wizardはプレゼンテーション層のみ
3. **AIコード不在**: 現時点でAI関連のコードは存在しない
4. **イベント駆動**: サーバーからのメッセージに応答する形式

---

## 2. 要件定義

### 2.1 機能要件

#### FR-01: AIプレイヤーモジュール
**説明:** 人間プレイヤーの代わりにゲームをプレイするAIモジュール

| 要件ID | 要件 | 優先度 |
|--------|------|--------|
| FR-01-01 | WebSocketメッセージを受信し、ゲーム状態を解析できること | P0 |
| FR-01-02 | ゲームの各フェーズに適切なアクションを返却できること | P0 |
| FR-01-03 | タイムアウト前に必ず応答を返すこと | P0 |
| FR-01-04 | Claude APIを使用して推論を行うこと | P0 |
| FR-01-05 | ゲーム開始前にデッキ分析を行い、ユーザーにフィードバックを表示すること | P0 |
| FR-01-06 | 2ラウンドごとに深い戦略分析を実行すること | P1 |
| FR-01-07 | 盤面複雑性を評価し、必要に応じてOpusモデルを使用すること | P1 |

#### FR-02: 対応アクション一覧
サーバーへ送信可能なアクション（`/src/hooks/game/websocket.ts` より）

| アクション | 説明 | Payload Type |
|-----------|------|--------------|
| `UnitDrive` | ユニットを手札からフィールドに召喚 | `UnitDrivePayload` |
| `JokerDrive` | JOKERカードを発動 | `JokerDrivePayload` |
| `Override` | ユニットをオーバーライド（強化） | `OverridePayload` |
| `EvolveDrive` | ユニットを進化 | `EvolveDrivePayload` |
| `Boot` | 起動効果を発動 | `BootPayload` |
| `TriggerSet` | トリガーゾーンにカードをセット | `TriggerSetPayload` |
| `Discard` | カードを捨てる | `DiscardPayload` |
| `Withdrawal` | ユニットを撤退 | `WithdrawalPayload` |
| `Choose` | 選択肢を選ぶ | `ChoosePayload` |
| `Continue` | 効果表示後に続行 | `ContinuePayload` |

#### FR-03: 対応イベント一覧
サーバーから受信するイベント（`/src/hooks/game/handler.ts` より）

| イベント | 説明 | 要応答 |
|---------|------|--------|
| `MulliganStart` | マリガンフェーズ開始 | Yes |
| `Sync` | ゲーム状態同期 | No |
| `DisplayEffect` | カード効果表示 | Yes (Continue) |
| `Choices` | 選択要求 | Yes (Choose) |
| `Selected` | 選択完了通知 | No |
| `TurnChange` | ターン切り替え | No |
| `Operation` | 操作権限変更 (freeze/defrost) | No |
| `VisualEffect` | 視覚効果通知 | No |
| `SoundEffect` | 音声効果通知 | No |

#### FR-04: 選択タイプ詳細
`Choices`イベントの選択タイプ（`/src/submodule/suit/types/game/system/index.ts` より）

| Type | 説明 | 応答形式 |
|------|------|----------|
| `option` | オプション選択 | `choice: [optionId]` |
| `card` | カード選択（複数可） | `choice: [cardId, ...]` |
| `intercept` | インターセプト選択 | `choice: [cardId]` or `[]` |
| `unit` | ユニット選択 | `choice: [unitId]` or `undefined` |
| `block` | ブロッカー選択 | `choice: [unitId]` or `undefined` |

#### FR-05: 推論可視化チャットUI
**説明:** AIの思考プロセスをユーザーに表示するチャットインターフェース

| 要件ID | 要件 | 優先度 |
|--------|------|--------|
| FR-05-01 | AIの推論内容をリアルタイムで表示するチャットUIを実装すること | P0 |
| FR-05-02 | ゲーム開始前分析の結果を表示し、ユーザーのフィードバックを受け付けること | P0 |
| FR-05-03 | 定期分析の結果（相手デッキタイプ推定、戦略提案）を表示すること | P1 |
| FR-05-04 | 各アクションの理由を簡潔に表示すること | P1 |
| FR-05-05 | チャット履歴をスクロールで確認できること | P2 |
| FR-05-06 | 表示/非表示の切り替えができること | P2 |

**チャットUI表示内容:**
```typescript
interface AIReasoningMessage {
  timestamp: Date;
  type: "analysis" | "decision" | "strategy" | "feedback_request";
  content: string;
  details?: {
    model: "haiku" | "sonnet" | "opus";
    confidence: number;
    alternatives?: string[];
  };
}

// 表示例
// [開始前分析] デッキ分析完了
// - キーカード: 魔将・信玄、進化ユニット群
// - 想定プラン: 中盤の進化ラッシュで盤面制圧
// - 注意点: 相手のインターセプトに警戒
// → この戦略でよろしいですか？ [承認] [再分析]

// [ターン3] ユニット召喚: 竜騎兵
// - 理由: CPを効率的に使用、盤面のプレッシャー維持
// - 次ターン候補: 進化によるアドバンテージ獲得

// [定期分析] 相手デッキ傾向
// - 推定タイプ: 黄色コントロール
// - 捨札から推測: 除去カード多め
// - 提案: ユニット展開を抑えめに
```

### 2.2 非機能要件

#### NFR-01: レイテンシ要件

| 状況 | 目標応答時間 | 理由 |
|------|-------------|------|
| 通常操作 | < 5秒 | ターンタイマー60秒に対して余裕確保 |
| 選択肢応答 | < 8秒 | 10秒制限あり |
| マリガン | < 8秒 | 10秒制限あり |
| タイムアウト警告 | < 1秒 | フォールバック必須 |

#### NFR-02: コスト効率
- **1ゲームあたりのAPI費用上限: $2.00**
- モデル使い分けによる最適化
- Opus使用時のコスト配分:
  - ゲーム開始前分析: ~$0.30-0.50
  - 定期分析（2ラウンドごと）: ~$0.20-0.30/回
  - 複雑盤面での判断: ~$0.10-0.20/回
  - 通常操作（Haiku/Sonnet）: 残りの予算

#### NFR-03: 信頼性
- タイムアウトによる敗北を防ぐ
- API障害時のフォールバック機構

---

## 3. 技術設計

### 3.1 データ構造

#### ゲーム状態 (GameState)
```typescript
// /src/hooks/game/context.tsx より
interface GameState {
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
```

#### プレイヤー (IPlayer)
```typescript
// /src/submodule/suit/types/game/player/index.ts より
interface IPlayer {
  id: string;
  name: string;
  deck: IAtom[];
  hand: IAtom[];
  field: IUnit[];
  trash: ICard[];
  delete: ICard[];
  trigger: IAtom[];
  purple: number | undefined;
  cp: { current: number; max: number };
  life: { current: number; max: number };
  joker: {
    card: IJoker[];
    gauge: number;
  };
}
```

#### カード (ICard / IUnit)
```typescript
// /src/submodule/suit/types/game/card/index.ts より
interface ICard extends IAtom {
  catalogId: string;
  lv: number;
  delta?: IDelta[];
  currentCost?: number;
}

interface IUnit extends ICard {
  bp: number;
  currentBP: number;
  active: boolean;
  isCopy: boolean;
  hasBootAbility: boolean | undefined;
  isBooted: boolean;
}
```

### 3.2 提案アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AI Module                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                          AIController                               │ │
│  │  - WebSocketメッセージのインターセプト                               │ │
│  │  - イベント→意思決定のルーティング                                   │ │
│  │  - タイムアウト管理                                                 │ │
│  │  - 盤面複雑性評価                                                   │ │
│  └─────────────────────────────┬──────────────────────────────────────┘ │
│                                │                                         │
│  ┌─────────────────────────────┼────────────────────────────────────┐   │
│  │                             ▼                                    │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                    DecisionEngine                          │  │   │
│  │  │                                                            │  │   │
│  │  │  ┌─────────────┐  ┌────────────────────────────────────┐  │  │   │
│  │  │  │ Heuristic   │  │         LLM Inference              │  │  │   │
│  │  │  │ Fallback    │  │         (Claude API)               │  │  │   │
│  │  │  │ (~10ms)     │  │                                    │  │  │   │
│  │  │  └─────────────┘  │  ┌───────┐ ┌────────┐ ┌────────┐  │  │  │   │
│  │  │                   │  │ Haiku │ │ Sonnet │ │ Opus   │  │  │  │   │
│  │  │                   │  │ 高速  │ │ 標準   │ │ 深思考 │  │  │  │   │
│  │  │                   │  │ ~200ms│ │ ~500ms │ │ ~2-8s  │  │  │  │   │
│  │  │                   │  └───────┘ └────────┘ └────────┘  │  │  │   │
│  │  │                   └────────────────────────────────────┘  │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │              BackgroundAnalyzer (Opus専用)                 │  │   │
│  │  │  - ゲーム開始前分析                                        │  │   │
│  │  │  - 定期分析 (2ラウンドごと)                                │  │   │
│  │  │  - 相手捨札傾向分析                                        │  │   │
│  │  │  - 中長期戦略提案                                          │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                    StateTranslator                         │  │   │
│  │  │  - GameState → CompactJSON変換                             │  │   │
│  │  │  - ID短縮マッピング                                        │  │   │
│  │  │  - カタログ情報付与                                        │  │   │
│  │  │  - 複雑性スコア計算                                        │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Chat UI (推論可視化)                       │   │
│  │  - AIの思考プロセス表示                                          │   │
│  │  - ゲーム開始前分析結果表示                                      │   │
│  │  - ユーザーフィードバック受付                                    │   │
│  │  - 定期分析結果表示                                              │   │
│  │  - アクション理由表示                                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 ID短縮システム（方針書案の検証）

**検証結果:** 有効な最適化

```typescript
// 実際のUUID形式 (例)
"player-abc123-def456-unit-xyz789"

// 短縮後
"u1" (ユニット), "c1" (カード)
```

**期待削減:** メッセージあたり100-200トークン

### 3.4 盤面表現フォーマット

方針書の`CompactGameState`を実際の型定義に合わせて修正:

```typescript
interface AIGameContext {
  // 基本情報
  turn: number;
  round: number;
  isMyTurn: boolean;

  // リソース
  self: {
    life: number;
    cp: { current: number; max: number };
    jokerGauge: number;
    handCount: number;
    deckCount: number;
  };
  opponent: {
    life: number;
    cp: { current: number; max: number };
    jokerGauge: number;
    handCount: number;
    deckCount: number;
  };

  // フィールド状態 (カタログ情報付き)
  myField: CompactUnit[];
  opponentField: CompactUnit[];

  // 手札 (カタログ情報付き)
  myHand: CompactCard[];
  myTrigger: CompactCard[];

  // 直近イベント (要約)
  recentEvents: string[];
}

interface CompactUnit {
  id: string;           // 短縮ID
  name: string;         // カード名
  catalogId: string;    // カタログ参照用
  bp: number;           // 現在BP
  baseBp: number;       // ベースBP
  cost: number;
  active: boolean;
  abilities: string[];  // 付与効果
  canBoot: boolean;     // 起動可能か
}

interface CompactCard {
  id: string;
  name: string;
  catalogId: string;
  cost: number;
  type: "unit" | "trigger" | "intercept" | "advanced_unit" | "virus";
  playable: boolean;    // 現在のCPでプレイ可能か
}
```

### 3.5 モデル使い分け戦略

#### 3.5.1 基本モデル選択

| タスク | 推奨モデル | 理由 | 推定レイテンシ |
|--------|-----------|------|---------------|
| 単純選択 (Yes/No) | Haiku | 低コスト、十分な精度 | ~200ms |
| カード選択 | Haiku/Sonnet | 複雑度に応じて | 200-500ms |
| 戦略的判断 | Sonnet | バランス良い | ~500ms |
| 複雑な盤面評価 | **Opus** | 最高精度、深い戦略分析 | ~2-5s |
| 定期分析 | **Opus** | 傾向分析、長期戦略 | ~3-8s |
| ゲーム開始前分析 | **Opus** | デッキ構築・キーカード分析 | ~5-15s |

#### 3.5.2 Opus使用条件

Opusは以下の条件を満たす場合に使用する:

**1. 盤面複雑性トリガー:**
```typescript
interface ComplexityEvaluation {
  // 複雑性スコア計算
  hasNonEntryEffects: boolean;    // 「場に出た時」以外の効果を持つカード
  deltaCount: number;             // フィールド上のDelta効果の総数
  triggerZoneActive: boolean;     // トリガーゾーンにカードがセットされている
  interceptsInHand: number;       // 手札のインターセプト枚数
  opponentFieldThreats: number;   // 相手フィールドの脅威度
}

function shouldUseOpus(eval: ComplexityEvaluation): boolean {
  const score =
    (eval.hasNonEntryEffects ? 3 : 0) +
    (eval.deltaCount * 1.5) +
    (eval.triggerZoneActive ? 2 : 0) +
    (eval.interceptsInHand * 1) +
    (eval.opponentFieldThreats * 1);

  return score >= 5; // 閾値は調整可能
}
```

**2. 定期分析トリガー:**
- 2ラウンドごと（自分と相手で4ターン分の経過後）
- 捨札傾向分析、相手デッキタイプ推定、中長期戦略の再評価
- メインターン処理とは独立してバックグラウンド実行も可

**3. ゲーム開始前分析:**
- マッチング完了からマリガン開始までの間に実行
- キーカード分析、勝利条件の特定、優先順位付け
- ユーザーへのフィードバック表示（Chat UI経由）

#### 3.5.3 バックグラウンド推論

ゲーム進行と並行して、Opusによる深い分析をバックグラウンドで実行:

```typescript
interface BackgroundAnalysis {
  // 相手の捨札からの傾向分析
  opponentTrashAnalysis: {
    discardedCards: string[];
    inferredDeckType: string;
    keyCardsProbablyInDeck: string[];
    threatAssessment: string;
  };

  // 中長期戦略
  strategicOutlook: {
    currentAdvantage: "winning" | "even" | "losing";
    recommendedPlaystyle: "aggressive" | "defensive" | "control";
    keyTurnsAhead: number;
    criticalDecisions: string[];
  };

  // 更新タイミング
  lastUpdatedRound: number;
  nextScheduledAnalysis: number;
}
```

---

## 4. 実装計画

### Phase 1: 基盤構築 (MVP)

**目標:** 動作するAIプレイヤーの最小実装

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 1.1 | AIモジュール基本構造 | `/src/ai/` ディレクトリ |
| 1.2 | WebSocketインターセプト | `AIController.ts` |
| 1.3 | 状態変換 | `StateTranslator.ts` |
| 1.4 | ヒューリスティック | `Heuristics.ts` |
| 1.5 | Claude API統合 (Haiku/Sonnet/Opus) | `LLMClient.ts` |
| 1.6 | 基本プロンプト | `prompts/` |
| 1.7 | **Chat UI基本実装** | `/src/components/ai/` |
| 1.8 | **盤面複雑性評価** | `ComplexityEvaluator.ts` |

**MVP定義:**
- マリガン対応
- ユニット召喚
- ターンエンド
- 基本的な選択応答
- **AI思考内容のChat UI表示**

### Phase 2: 推論改善

| タスク | 詳細 |
|--------|------|
| 2.1 | カタログ情報の活用 |
| 2.2 | 戦略プロンプトの洗練 |
| 2.3 | 攻撃/ブロック判断 |
| 2.4 | インターセプト判断 |
| 2.5 | **ゲーム開始前分析 (Opus)** |
| 2.6 | **ユーザーフィードバック機能** |

### Phase 3: 高度な機能

| タスク | 詳細 |
|--------|------|
| 3.1 | コンテキスト管理 (スライディングウィンドウ) |
| 3.2 | 世代管理による陳腐化検出 |
| 3.3 | デッキ認識・戦略適応 |
| 3.4 | コンボ検出・記録 |
| 3.5 | **定期分析 (2ラウンドごと、Opus)** |
| 3.6 | **相手捨札傾向分析** |
| 3.7 | **バックグラウンド推論** |

### Phase 4: 最適化

| タスク | 詳細 |
|--------|------|
| 4.1 | レイテンシ最適化 |
| 4.2 | コスト最適化 |
| 4.3 | 並列推論（必要に応じて） |

---

## 5. 方針書との比較・評価

### 5.1 採用する提案

| 提案 | 採用 | 理由 |
|------|------|------|
| ID短縮システム | ✅ | トークン効率化に有効 |
| CompactGameState | ✅ (修正版) | 実際の型に合わせて調整 |
| ヒューリスティックフォールバック | ✅ | タイムアウト防止に必須 |
| 世代管理 | ✅ | イベント駆動に適合 |
| スライディングウィンドウ | ✅ | 長期戦対応 |

### 5.2 修正・拡張した提案

| 提案 | 修正点 | 理由 |
|------|--------|------|
| マルチモデル戦略 | 条件付きOpus使用を追加 | 複雑盤面・定期分析に有効 |
| Opus使用 | **採用** (条件付き) | $2/ゲーム予算で複雑な判断に活用 |
| 投機的実行 | Phase 4へ延期 | 優先度低 |
| 階層スレッド構造 | 簡素化 | まず単一コンテキストで開始 |
| ユーザーインタラクション | **新規追加**: Chat UI | 推論内容の可視化・フィードバック |

### 5.3 新規に必要な考慮事項

| 項目 | 詳細 |
|------|------|
| カタログ統合 | カード効果テキストをプロンプトに含める |
| 既存hooks活用 | Zustandストアとの統合方法 |
| UI連携 | AI操作の視覚化（オプション） |
| テスト戦略 | モック対戦環境の構築 |

---

## 6. ファイル構成案

```
/src
├── ai/
│   ├── index.ts                   # エクスポート
│   ├── AIController.ts            # メインコントローラー
│   ├── DecisionEngine.ts          # 意思決定エンジン
│   ├── StateTranslator.ts         # 状態変換
│   ├── IdMapper.ts                # ID短縮マッピング
│   ├── Heuristics.ts              # ルールベースフォールバック
│   ├── LLMClient.ts               # Claude API クライアント
│   ├── ContextManager.ts          # コンテキスト管理
│   ├── BackgroundAnalyzer.ts      # バックグラウンド分析 (Opus)
│   ├── ComplexityEvaluator.ts     # 盤面複雑性評価
│   ├── PreGameAnalyzer.ts         # ゲーム開始前分析
│   ├── types.ts                   # AI固有の型定義
│   ├── constants.ts               # 設定値
│   └── prompts/
│       ├── system.ts              # システムプロンプト
│       ├── mulligan.ts            # マリガン用
│       ├── action.ts              # アクション決定用
│       ├── choice.ts              # 選択肢用
│       ├── analysis.ts            # 盤面分析用
│       ├── pregame.ts             # ゲーム開始前分析用
│       └── periodic.ts            # 定期分析用
│
└── components/
    └── ai/
        ├── AIChat.tsx             # チャットUIメインコンポーネント
        ├── AIChatMessage.tsx      # メッセージ表示コンポーネント
        ├── AIChatInput.tsx        # ユーザー入力（フィードバック）
        ├── AIAnalysisCard.tsx     # 分析結果カード
        ├── AIStrategyBadge.tsx    # 戦略バッジ表示
        └── hooks/
            ├── useAIChat.ts       # チャット状態管理
            └── useAIAnalysis.ts   # 分析結果管理
```

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| APIレイテンシ超過 | タイムアウト敗北 | ヒューリスティックフォールバック |
| API障害 | ゲーム続行不可 | ローカルフォールバック |
| トークン超過 | コスト増大 | 圧縮・要約の徹底 |
| 不正な応答 | 無効手送信 | バリデーション層 |
| 相手の切断 | ゲーム中断 | 既存の切断処理を継承 |

---

## 8. 成功指標

| 指標 | 目標値 |
|------|--------|
| タイムアウト率 | < 1% |
| 通常操作平均応答時間 | < 3秒 |
| Opus使用時応答時間 | < 10秒 |
| 1ゲームあたりコスト | **< $2.00** |
| 妥当な手の選択率 | > 90% |
| ゲーム完了率 | > 99% |
| ユーザーフィードバック承認率 | > 80% |

---

## 9. 次のステップ

1. **レビュー:** 本要件定義書のレビュー・承認
2. **環境構築:** Claude API キーの設定、開発環境準備
3. **Phase 1開始:** 基盤構築の着手
4. **テスト環境:** モック対戦環境の構築

---

## 付録A: 参考ファイル一覧

| ファイル | 用途 |
|---------|------|
| `/src/hooks/game/handler.ts` | メッセージハンドラー（参考実装） |
| `/src/hooks/game/websocket.ts` | WebSocket操作（参考実装） |
| `/src/hooks/game/context.tsx` | Zustandストア |
| `/src/submodule/suit/types/` | 型定義 |
| `/src/submodule/suit/catalog/` | カードカタログ |
| `/src/service/websocket.ts` | WebSocketサービス |

## 付録B: 環境変数

```bash
# 既存
NEXT_PUBLIC_SERVER_HOST=      # ゲームサーバーホスト
NEXT_PUBLIC_SECURE_CONNECTION # wss使用フラグ

# 新規（AI用）
ANTHROPIC_API_KEY=            # Claude APIキー
AI_MODE_ENABLED=              # AI機能有効化フラグ
AI_DEFAULT_MODEL=             # デフォルトモデル (haiku/sonnet)
AI_OPUS_ENABLED=              # Opus使用許可フラグ
AI_COST_LIMIT_PER_GAME=       # 1ゲームあたりのコスト上限 (デフォルト: 2.00)
AI_COMPLEXITY_THRESHOLD=      # Opus使用の複雑性閾値 (デフォルト: 5)
AI_PERIODIC_ANALYSIS_ROUNDS=  # 定期分析の間隔 (デフォルト: 2ラウンド)
AI_CHAT_UI_ENABLED=           # チャットUI表示フラグ
AI_DEBUG_LOG=                 # デバッグログ有効化
```
