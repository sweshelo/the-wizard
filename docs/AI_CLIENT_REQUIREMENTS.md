# CODE OF JOKER AI Client 要件定義書

**バージョン:** 1.0
**作成日:** 2026-01-29
**ステータス:** ドラフト

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

### 2.2 非機能要件

#### NFR-01: レイテンシ要件

| 状況 | 目標応答時間 | 理由 |
|------|-------------|------|
| 通常操作 | < 5秒 | ターンタイマー60秒に対して余裕確保 |
| 選択肢応答 | < 8秒 | 10秒制限あり |
| マリガン | < 8秒 | 10秒制限あり |
| タイムアウト警告 | < 1秒 | フォールバック必須 |

#### NFR-02: コスト効率
- 1ゲームあたりのAPI費用目安: $0.10-0.50
- モデル使い分けによる最適化必須

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
┌─────────────────────────────────────────────────────────────┐
│                        AI Module                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   AIController                        │   │
│  │  - WebSocketメッセージのインターセプト                  │   │
│  │  - イベント→意思決定のルーティング                      │   │
│  │  - タイムアウト管理                                    │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          │                                   │
│  ┌───────────────────────┼──────────────────────────────┐   │
│  │                       ▼                               │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │              DecisionEngine                      │ │   │
│  │  │                                                  │ │   │
│  │  │  ┌─────────────┐  ┌─────────────────────────┐  │ │   │
│  │  │  │ Heuristic   │  │ LLM Inference           │  │ │   │
│  │  │  │ Fallback    │  │ (Claude API)            │  │ │   │
│  │  │  │ (~10ms)     │  │                         │  │ │   │
│  │  │  └─────────────┘  │  ┌───────┐ ┌────────┐  │  │ │   │
│  │  │                   │  │ Haiku │ │ Sonnet │  │  │ │   │
│  │  │                   │  │ 高速  │ │ 標準   │  │  │ │   │
│  │  │                   │  └───────┘ └────────┘  │  │ │   │
│  │  │                   └─────────────────────────┘  │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │              StateTranslator                     │ │   │
│  │  │  - GameState → CompactJSON変換                   │ │   │
│  │  │  - ID短縮マッピング                              │ │   │
│  │  │  - カタログ情報付与                              │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
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

| タスク | 推奨モデル | 理由 | 推定レイテンシ |
|--------|-----------|------|---------------|
| 単純選択 (Yes/No) | Haiku | 低コスト、十分な精度 | ~200ms |
| カード選択 | Haiku/Sonnet | 複雑度に応じて | 200-500ms |
| 戦略的判断 | Sonnet | バランス良い | ~500ms |
| 複雑な盤面評価 | Sonnet | 精度重視 | ~800ms |
| Opus | 不使用 | コスト/レイテンシ過大 | - |

**方針書との相違点:**
- Opusは現実的ではない（コスト・レイテンシ）
- 並列推論より段階的フォールバックを優先

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
| 1.5 | Claude API統合 | `LLMClient.ts` |
| 1.6 | 基本プロンプト | `prompts/` |

**MVP定義:**
- マリガン対応
- ユニット召喚
- ターンエンド
- 基本的な選択応答

### Phase 2: 推論改善

| タスク | 詳細 |
|--------|------|
| 2.1 | カタログ情報の活用 |
| 2.2 | 戦略プロンプトの洗練 |
| 2.3 | 攻撃/ブロック判断 |
| 2.4 | インターセプト判断 |

### Phase 3: 高度な機能

| タスク | 詳細 |
|--------|------|
| 3.1 | コンテキスト管理 (スライディングウィンドウ) |
| 3.2 | 世代管理による陳腐化検出 |
| 3.3 | デッキ認識・戦略適応 |
| 3.4 | コンボ検出・記録 |

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

### 5.2 修正が必要な提案

| 提案 | 修正点 | 理由 |
|------|--------|------|
| マルチモデル並列処理 | 簡素化 | 複雑すぎる、Haiku+Sonnetで十分 |
| Opus使用 | 削除 | コスト/レイテンシ過大 |
| 投機的実行 | Phase 4へ延期 | 優先度低 |
| 階層スレッド構造 | 簡素化 | まず単一コンテキストで開始 |

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
└── ai/
    ├── index.ts                 # エクスポート
    ├── AIController.ts          # メインコントローラー
    ├── DecisionEngine.ts        # 意思決定エンジン
    ├── StateTranslator.ts       # 状態変換
    ├── IdMapper.ts              # ID短縮マッピング
    ├── Heuristics.ts            # ルールベースフォールバック
    ├── LLMClient.ts             # Claude API クライアント
    ├── ContextManager.ts        # コンテキスト管理
    ├── types.ts                 # AI固有の型定義
    ├── constants.ts             # 設定値
    └── prompts/
        ├── system.ts            # システムプロンプト
        ├── mulligan.ts          # マリガン用
        ├── action.ts            # アクション決定用
        ├── choice.ts            # 選択肢用
        └── analysis.ts          # 盤面分析用
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
| 平均応答時間 | < 3秒 |
| 1ゲームあたりコスト | < $0.30 |
| 妥当な手の選択率 | > 90% |
| ゲーム完了率 | > 99% |

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
AI_DEBUG_LOG=                 # デバッグログ有効化
```
