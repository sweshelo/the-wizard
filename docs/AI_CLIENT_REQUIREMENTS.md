# CODE OF JOKER AI Client 要件定義書

**バージョン:** 1.3
**作成日:** 2026-01-29
**更新日:** 2026-01-29
**ステータス:** ドラフト (スレッド管理・Knowledge Storage追加)

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

### 3.4.1 TOON (Token-Oriented Object Notation) フォーマット

JSONのトークン効率を改善するため、**TOON形式**を採用する。

**参考:** [toon-format/toon](https://github.com/toon-format/toon)

#### TOONとは
- JSONデータモデルのコンパクトで人間可読なエンコーディング
- YAMLスタイルのインデントとCSVスタイルの表形式を組み合わせ
- **30-60%のトークン削減**を実現
- LLMの理解精度を維持または向上（73.9% vs JSON 69.7%）

#### TOON変換例

**JSON形式 (従来):**
```json
{
  "myField": [
    {"id": "u1", "name": "竜騎兵", "bp": 5000, "active": true},
    {"id": "u2", "name": "魔将・信玄", "bp": 7000, "active": false}
  ]
}
```

**TOON形式 (新規):**
```toon
myField[2]{id,name,bp,active}:
  u1,竜騎兵,5000,true
  u2,魔将・信玄,7000,false
```

#### AIGameContext のTOON表現

```toon
context:
  turn: 5
  round: 2
  isMyTurn: true

self:
  life: 6
  cp: 4/7
  jokerGauge: 3
  handCount: 4
  deckCount: 22

opponent:
  life: 5
  cp: 2/7
  jokerGauge: 5
  handCount: 3
  deckCount: 18

myField[2]{id,name,bp,active,abilities}:
  u1,竜騎兵,5000,true,[]
  u2,魔将・信玄,7000,false,[不屈]

opponentField[1]{id,name,bp,active,abilities}:
  u3,蒼炎の魔術師,4000,true,[加護]

myHand[3]{id,name,cost,type,playable}:
  c1,炎の槍,2,intercept,true
  c2,進化の秘宝,3,trigger,true
  c3,巨神兵,6,unit,false

myTrigger[1]{id,name}:
  t1,突撃命令
```

**期待削減:** 従来JSON比で約40-50%のトークン削減

### 3.4.2 カタログ・キーワード参照システム

ゲームオブジェクト内にはカード効果テキストが含まれないため、外部カタログを参照する必要がある。

#### データソース

| ファイル | パス | 内容 |
|---------|------|------|
| カタログ | `/src/submodule/suit/catalog/catalog.json` | カード情報（効果テキスト含む） |
| キーワード | `/src/submodule/suit/catalog/keywords.json` | キーワード能力定義 |

#### カタログエントリ構造
```typescript
interface CatalogEntry {
  id: string;           // カードID (例: "＜ウィルス・炎＞")
  name: string;         // カード名
  rarity: string;       // レアリティ
  type: "unit" | "trigger" | "intercept" | "advanced_unit" | "virus";
  color: number;        // 1:赤, 2:黄, 3:青, 4:緑, 5:紫
  species: string[];    // 種族
  cost: number;         // コスト
  bp: [number, number, number];  // BP (Lv1, Lv2, Lv3)
  ability: string;      // 効果テキスト（改行含む）
  originality: string;  // オリジナリティ
}
```

#### キーワード能力構造
```typescript
interface KeywordEntry {
  title: string;        // キーワード名 (例: "不屈")
  matcher: string;      // マッチパターン (例: "【不屈】")
  text: string;         // 短い説明
  description: string;  // 詳細説明
}
```

### 3.4.3 MCP サーバー実装

Claude APIのTool Use機能を活用し、カタログ・キーワード参照をMCPサーバーとして実装する。

#### MCPサーバー定義

```typescript
// MCP Server: catalog-lookup
interface CatalogMCPServer {
  name: "coj-catalog";
  version: "1.0.0";
  tools: [
    {
      name: "lookup_card";
      description: "カードIDまたは名前からカード情報を取得";
      parameters: {
        query: string;      // カードIDまたは名前
        fields?: string[];  // 取得するフィールド (省略時は全て)
      };
      returns: CatalogEntry | null;
    },
    {
      name: "lookup_keyword";
      description: "キーワード能力の説明を取得";
      parameters: {
        keyword: string;    // キーワード名またはマッチパターン
      };
      returns: KeywordEntry | null;
    },
    {
      name: "search_cards";
      description: "条件に合うカードを検索";
      parameters: {
        color?: number;
        type?: string;
        costRange?: [number, number];
        species?: string;
        abilityContains?: string;  // 効果テキスト部分一致
        limit?: number;
      };
      returns: CatalogEntry[];
    },
    {
      name: "get_card_abilities";
      description: "カードの効果テキストをパースしてキーワード能力リストを返す";
      parameters: {
        cardId: string;
      };
      returns: {
        rawAbility: string;
        keywords: KeywordEntry[];
        effects: string[];  // キーワード以外の効果
      };
    }
  ];
}
```

#### Haiku/Sonnet向けツール呼び出し

軽量モデル（Haiku/Sonnet）が使用するTool定義:

```typescript
const catalogTools = [
  {
    name: "lookup_card",
    description: "カード情報を取得。効果テキストやキーワード能力を確認する際に使用。",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "カードIDまたはカード名"
        },
        fields: {
          type: "array",
          items: { type: "string" },
          description: "取得フィールド。省略で全て。例: ['ability', 'bp', 'cost']"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "lookup_keyword",
    description: "【不屈】や【加護】などのキーワード能力の効果を確認",
    input_schema: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "キーワード名。例: '不屈', '加護', '貫通'"
        }
      },
      required: ["keyword"]
    }
  }
];
```

#### ツール使用フロー

```
1. AIがゲーム状態を受信
2. 不明なカード効果がある場合、lookup_card ツールを呼び出し
3. キーワード能力の詳細が必要な場合、lookup_keyword ツールを呼び出し
4. 取得した情報を元に意思決定
```

#### キャッシュ戦略

```typescript
interface CatalogCache {
  // ゲーム中に参照されたカードをキャッシュ
  cards: Map<string, CatalogEntry>;
  keywords: Map<string, KeywordEntry>;

  // キャッシュヒット時はAPI呼び出し不要
  // 1ゲーム中の同一カード参照を最適化
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

### 3.6 スレッド管理アーキテクチャ

#### 3.6.1 スレッド構成

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Thread Architecture                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Game Session Thread (Primary)                         │  │
│  │  Model: Haiku/Sonnet (状況に応じて)                                │  │
│  │  Purpose: リアルタイム意思決定                                      │  │
│  │                                                                    │  │
│  │  Contents:                                                         │  │
│  │  - マリガン、ユニット召喚、選択応答                                 │  │
│  │  - 最近のイベント履歴 (DisplayEffect/VisualEvent)                  │  │
│  │  - 分析スレッドからの戦略サマリー                                   │  │
│  │  - ユーザーからの追加メッセージと応答                               │  │
│  └────────────────────────────────────────────────△──────────────────┘  │
│                                                   │                      │
│                         ┌─────────────────────────┤                      │
│                         │  Strategy Injection     │                      │
│                         │  (要約を注入)           │                      │
│              ┌──────────┴────────┐  ┌────────────┴─────────┐            │
│              │                   │  │                      │            │
│   ┌──────────▼─────────┐  ┌──────▼──────────────┐          │            │
│   │ Pregame Thread     │  │ Periodic Thread     │          │            │
│   │ (One-shot)         │  │ (Background)        │          │            │
│   │ Model: Opus        │  │ Model: Opus         │          │            │
│   │                    │  │                     │          │            │
│   │ - デッキ分析       │  │ - 2ラウンドごと     │          │            │
│   │ - キーカード特定   │  │ - 捨札傾向分析      │          │            │
│   │ - 戦略立案         │  │ - 戦略再評価        │          │            │
│   │ → 完了後破棄       │  │ → ゲーム終了まで    │          │            │
│   │                    │  │                     │          │            │
│   │ [Chat UI Access]   │  │ [Chat UI Access]    │          │            │
│   └────────────────────┘  └─────────────────────┘          │            │
│                                                             │            │
└─────────────────────────────────────────────────────────────┘            │
```

#### 3.6.2 スレッド定義

```typescript
interface ThreadManager {
  // スレッド識別
  gameId: string;
  threads: {
    gameSession: GameSessionThread;
    pregame: PregameThread | null;
    periodic: PeriodicThread | null;
  };
}

interface BaseThread {
  id: string;
  type: "game_session" | "pregame" | "periodic";
  createdAt: Date;
  messages: ThreadMessage[];
  model: "haiku" | "sonnet" | "opus";
}

interface GameSessionThread extends BaseThread {
  type: "game_session";
  model: "haiku" | "sonnet";  // 複雑性に応じて切り替え

  // コンテキスト管理
  contextWindow: {
    maxTurns: number;           // 保持する最大ターン数 (default: 20)
    currentMessages: number;
    summarizedUntilTurn: number;
  };

  // 注入された戦略
  injectedStrategies: StrategyInjection[];

  // イベント履歴
  gameEvents: GameEventEntry[];
}

interface PregameThread extends BaseThread {
  type: "pregame";
  model: "opus";
  status: "running" | "completed" | "failed";
  result?: PregameAnalysisResult;
  userFeedback?: UserFeedback;
}

interface PeriodicThread extends BaseThread {
  type: "periodic";
  model: "opus";
  lastAnalysisRound: number;
  analyses: PeriodicAnalysisResult[];
}
```

#### 3.6.3 ユーザーメッセージ処理

ユーザーが承認/選択以外のメッセージを送信した場合の処理:

```typescript
interface UserChatMessage {
  id: string;
  timestamp: Date;
  content: string;
  context: {
    currentTurn: number;
    currentRound: number;
    threadType: "game_session" | "pregame" | "periodic";
  };
}

interface AIResponse {
  id: string;
  timestamp: Date;
  content: string;
  model: "sonnet" | "opus";  // ユーザーメッセージにはSonnet以上で応答

  // 学習内容として保存するか
  knowledge?: KnowledgeEntry;
}

// ユーザーメッセージ処理フロー
async function handleUserMessage(
  message: UserChatMessage,
  thread: BaseThread
): Promise<AIResponse> {
  // 1. メッセージの意図を判定
  const intent = analyzeIntent(message.content);

  // 2. モデル選択
  const model = intent.requiresDeepThinking ? "opus" : "sonnet";

  // 3. 現在のスレッドコンテキストで応答生成
  const response = await generateResponse(message, thread, model);

  // 4. 知識として保存すべきか判定
  if (shouldStoreAsKnowledge(message, response)) {
    const knowledge = extractKnowledge(message, response);
    await storeKnowledge(knowledge);
  }

  return response;
}
```

#### 3.6.4 Knowledge Storage (LocalStorage)

ユーザーとの対話から得られた知識を永続化:

```typescript
interface KnowledgeEntry {
  id: string;
  createdAt: Date;
  gameId?: string;           // 特定ゲームに紐づく場合

  type: "preference" | "strategy" | "correction" | "insight";

  content: {
    topic: string;           // 例: "ブロック判断", "進化タイミング"
    insight: string;         // 学習内容
    context?: string;        // 状況説明
  };

  // 適用条件
  applicability: {
    deckTypes?: string[];    // 特定デッキタイプに適用
    situations?: string[];   // 特定状況に適用
    always?: boolean;        // 常に適用
  };

  // 有効性
  confidence: number;        // 0-1
  usageCount: number;        // 参照回数
  lastUsed?: Date;
}

// LocalStorage キー
const KNOWLEDGE_STORAGE_KEY = "coj-ai-knowledge";

// Knowledge Store
interface KnowledgeStore {
  entries: KnowledgeEntry[];

  // 操作
  add(entry: KnowledgeEntry): void;
  search(query: KnowledgeQuery): KnowledgeEntry[];
  getRelevant(gameState: AIGameContext): KnowledgeEntry[];
  prune(): void;  // 古い/低信頼度のエントリを削除
}

// プロンプトへの注入
function injectKnowledge(
  prompt: string,
  knowledge: KnowledgeEntry[]
): string {
  if (knowledge.length === 0) return prompt;

  const knowledgeSection = knowledge
    .map(k => `- ${k.content.topic}: ${k.content.insight}`)
    .join("\n");

  return `${prompt}

## ユーザーから学習した知識
${knowledgeSection}
`;
}
```

#### 3.6.5 DisplayEffect/VisualEvent 展開

ゲームイベントをスレッドに軽量展開:

```typescript
// サーバーから受信するイベント
interface DisplayEffectEvent {
  type: "DisplayEffect";
  payload: {
    effect: {
      name: string;           // 効果名
      source?: string;        // 発動元カードID
      message?: string;       // 表示メッセージ
    };
  };
}

interface VisualEffectEvent {
  type: "VisualEffect";
  payload: {
    effect: string;           // エフェクト種別
    target?: string;          // 対象ID
    message?: string;         // 例: "ユニットを破壊"
  };
}

// スレッドに展開する形式
interface GameEventEntry {
  turn: number;
  round: number;
  timestamp: Date;

  type: "effect" | "action" | "phase_change";

  // 軽量な要約形式
  summary: string;

  // 例:
  // "【不屈】発動: 魔将・信玄 → 行動権回復"
  // "効果: 裁きの光 → 竜騎兵を破壊"
  // "トリガー発動: 突撃命令 → 全ユニット+2000BP"
}

// イベント変換
function convertToGameEvent(
  event: DisplayEffectEvent | VisualEffectEvent,
  gameState: GameState
): GameEventEntry {
  const { turn, round } = gameState.game;

  if (event.type === "DisplayEffect") {
    const sourceName = resolveCardName(event.payload.effect.source, gameState);
    return {
      turn,
      round,
      timestamp: new Date(),
      type: "effect",
      summary: `【${event.payload.effect.name}】${sourceName ? `: ${sourceName}` : ""} ${event.payload.effect.message || ""}`
    };
  }

  // VisualEffect
  const targetName = resolveCardName(event.payload.target, gameState);
  return {
    turn,
    round,
    timestamp: new Date(),
    type: "effect",
    summary: `${event.payload.effect}${targetName ? `: ${targetName}` : ""} ${event.payload.message || ""}`
  };
}

// スレッドへの追加
function appendEventToThread(
  thread: GameSessionThread,
  event: GameEventEntry
): void {
  thread.gameEvents.push(event);

  // 古いイベントは要約して圧縮
  if (thread.gameEvents.length > MAX_EVENTS) {
    compressOldEvents(thread);
  }
}
```

#### 3.6.6 バックグラウンドスレッドUIアクセス

Pregame/Periodicスレッドへのユーザーアクセス:

```typescript
interface BackgroundThreadUIAccess {
  // スレッド状態の表示
  getStatus(threadType: "pregame" | "periodic"): ThreadStatus;

  // 分析結果の詳細表示
  getAnalysisDetail(threadId: string): AnalysisDetail;

  // ユーザーがスレッドにメッセージを送信
  sendMessage(
    threadType: "pregame" | "periodic",
    message: string
  ): Promise<AIResponse>;

  // 分析の再実行リクエスト
  requestReanalysis(threadType: "pregame" | "periodic"): Promise<void>;
}

interface ThreadStatus {
  type: "pregame" | "periodic";
  status: "idle" | "running" | "completed" | "error";
  progress?: number;          // 0-100
  lastResult?: {
    timestamp: Date;
    summary: string;
  };
  nextScheduled?: Date;       // periodic のみ
}
```

#### 3.6.7 コンテキストウィンドウ管理

```typescript
interface ContextWindowManager {
  // 最大保持ターン数
  maxTurns: number;

  // 現在のコンテキストサイズ (推定トークン数)
  estimatedTokens: number;

  // 古いメッセージの要約
  summarize(
    messages: ThreadMessage[],
    upToTurn: number
  ): Promise<string>;

  // コンテキスト圧縮
  compress(thread: GameSessionThread): Promise<void>;
}

// 要約戦略
const SUMMARIZATION_CONFIG = {
  // 要約対象とするターン数の閾値
  summarizeAfterTurns: 10,

  // 要約時に保持する詳細ターン数
  keepDetailedTurns: 5,

  // 要約に使用するモデル
  summaryModel: "haiku" as const,

  // イベント要約の最大長
  maxEventSummaryLength: 500,
};
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
│   │
│   ├── catalog/                   # カタログ参照システム
│   │   ├── index.ts               # エクスポート
│   │   ├── CatalogService.ts      # カタログ検索サービス
│   │   ├── KeywordService.ts      # キーワード能力検索
│   │   ├── CatalogCache.ts        # キャッシュ管理
│   │   ├── CatalogTools.ts        # Claude Tool定義
│   │   └── types.ts               # カタログ型定義
│   │
│   ├── toon/                      # TOON形式変換
│   │   ├── index.ts               # エクスポート
│   │   ├── encoder.ts             # JSON→TOON変換
│   │   ├── decoder.ts             # TOON→JSON変換
│   │   ├── gameState.ts           # ゲーム状態TOON変換
│   │   └── types.ts               # TOON型定義
│   │
│   ├── chat/                      # チャットメッセージ管理
│   │   ├── index.ts               # エクスポート
│   │   ├── types.ts               # メッセージ型定義
│   │   ├── formatter.ts           # メッセージフォーマット
│   │   ├── MessageBuilder.ts      # メッセージ構築
│   │   ├── toonFormatter.ts       # TOON形式フォーマット
│   │   └── eventConverter.ts      # DisplayEffect/VisualEvent変換
│   │
│   ├── thread/                    # スレッド管理
│   │   ├── index.ts               # エクスポート
│   │   ├── types.ts               # スレッド型定義
│   │   ├── ThreadManager.ts       # スレッド管理
│   │   ├── GameSessionThread.ts   # メインゲームスレッド
│   │   ├── PregameThread.ts       # ゲーム開始前分析スレッド
│   │   ├── PeriodicThread.ts      # 定期分析スレッド
│   │   └── ContextWindowManager.ts # コンテキストウィンドウ管理
│   │
│   ├── knowledge/                 # 知識ストレージ (LocalStorage)
│   │   ├── index.ts               # エクスポート
│   │   ├── types.ts               # Knowledge型定義
│   │   ├── KnowledgeStore.ts      # LocalStorage管理
│   │   ├── KnowledgeExtractor.ts  # 会話からの知識抽出
│   │   └── KnowledgeInjector.ts   # プロンプトへの知識注入
│   │
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
        ├── AIChat.tsx             # チャットUIメインコンテナ
        ├── AIChatHeader.tsx       # ヘッダー（最小化/閉じる）
        ├── AIChatMessageList.tsx  # メッセージリスト
        ├── AIChatMessage.tsx      # 個別メッセージ表示
        ├── AIChatMessageDetail.tsx # 詳細展開表示
        ├── AIChatInteraction.tsx  # ユーザーインタラクション
        ├── AIChatModelBadge.tsx   # モデルバッジ表示
        ├── AIChatSettings.tsx     # 設定パネル
        └── hooks/
            ├── useAIChatStore.ts  # Zustandストア
            ├── useAIChatMessages.ts # メッセージ管理
            └── useAIChatSettings.ts # 設定管理
```

**関連ドキュメント:**
- Chat UI詳細仕様: [AI_CHAT_UI_REQUIREMENTS.md](./AI_CHAT_UI_REQUIREMENTS.md)

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
