# CODE OF JOKER AI Chat UI 要件定義書

**バージョン:** 1.0
**作成日:** 2026-01-29
**関連文書:** [AI_CLIENT_REQUIREMENTS.md](./AI_CLIENT_REQUIREMENTS.md)

---

## 1. 概要

### 1.1 目的

AIの推論プロセスをユーザーに可視化し、戦略的フィードバックを可能にするチャットインターフェースの要件を定義する。

### 1.2 設計原則

- **透明性**: AIの意思決定過程を明確に表示
- **インタラクティブ性**: ユーザーが戦略にフィードバック可能
- **非侵入性**: ゲームプレイを妨げないUI設計
- **効率性**: 重要な情報を簡潔に表示

---

## 2. メッセージタイプ定義

### 2.1 メッセージカテゴリ

| カテゴリ | 説明 | 発生タイミング |
|---------|------|---------------|
| `pregame_analysis` | ゲーム開始前分析 | マッチング後〜マリガン前 |
| `periodic_analysis` | 定期分析 | 2ラウンドごと |
| `turn_decision` | ターン中の意思決定 | 自ターン中 |
| `choice_response` | 選択肢への応答 | Choicesイベント受信時 |
| `strategy_update` | 戦略変更通知 | 状況変化時 |
| `feedback_request` | ユーザーフィードバック要求 | 分析完了時 |
| `user_response` | ユーザーメッセージへの応答 | ユーザー入力時 |
| `game_event` | ゲームイベント表示 | DisplayEffect/VisualEvent受信時 |
| `system` | システムメッセージ | エラー・警告時 |

---

## 3. メッセージオブジェクト仕様

### 3.1 基本構造

```typescript
interface AIChatMessage {
  id: string;                    // UUID
  timestamp: Date;
  category: MessageCategory;
  priority: "high" | "medium" | "low";

  // 表示内容
  content: MessageContent;

  // メタデータ
  meta: {
    model: "haiku" | "sonnet" | "opus";
    tokenUsed?: number;
    latencyMs?: number;
    gameState?: {
      turn: number;
      round: number;
    };
  };

  // インタラクション
  interaction?: MessageInteraction;
}

type MessageCategory =
  | "pregame_analysis"
  | "periodic_analysis"
  | "turn_decision"
  | "choice_response"
  | "strategy_update"
  | "feedback_request"
  | "user_response"
  | "game_event"
  | "system";

interface MessageContent {
  title: string;
  body: string;
  details?: ContentDetail[];
}

interface ContentDetail {
  label: string;
  value: string;
  type: "text" | "card" | "unit" | "keyword" | "warning";
}

interface MessageInteraction {
  type: "confirm" | "choice" | "rating" | "none";
  options?: InteractionOption[];
  selected?: string;
  feedback?: string;
}

interface InteractionOption {
  id: string;
  label: string;
  description?: string;
}
```

---

## 4. 具体的なメッセージ例

### 4.1 ゲーム開始前分析 (pregame_analysis)

```json
{
  "id": "msg-001",
  "timestamp": "2026-01-29T14:30:00.000Z",
  "category": "pregame_analysis",
  "priority": "high",
  "content": {
    "title": "デッキ分析完了",
    "body": "あなたのデッキを分析しました。中盤の進化ラッシュによる盤面制圧を主軸とする構築です。",
    "details": [
      {
        "label": "キーカード",
        "value": "魔将・信玄、進化の秘宝、紅蓮の魔導師",
        "type": "card"
      },
      {
        "label": "想定プラン",
        "value": "序盤はCPを温存し、4-5ターン目に進化ユニットを連続展開",
        "type": "text"
      },
      {
        "label": "警戒点",
        "value": "黄色の除去カード（裁きの光、神の一撃）に注意",
        "type": "warning"
      },
      {
        "label": "勝利条件",
        "value": "進化ユニット2体以上でのアタック成功",
        "type": "text"
      }
    ]
  },
  "meta": {
    "model": "opus",
    "tokenUsed": 2340,
    "latencyMs": 8500
  },
  "interaction": {
    "type": "confirm",
    "options": [
      {
        "id": "approve",
        "label": "この戦略で開始",
        "description": "分析結果を承認し、ゲームを開始します"
      },
      {
        "id": "reanalyze",
        "label": "再分析",
        "description": "異なる観点で再度分析を実行します"
      },
      {
        "id": "aggressive",
        "label": "攻撃的に変更",
        "description": "より攻撃的な戦略に調整します"
      },
      {
        "id": "defensive",
        "label": "守備的に変更",
        "description": "より守備的な戦略に調整します"
      }
    ]
  }
}
```

### 4.2 定期分析 (periodic_analysis)

```json
{
  "id": "msg-012",
  "timestamp": "2026-01-29T14:35:00.000Z",
  "category": "periodic_analysis",
  "priority": "medium",
  "content": {
    "title": "ラウンド2終了時分析",
    "body": "相手の捨札から黄色コントロールデッキと推定。除去カードへの警戒を強化します。",
    "details": [
      {
        "label": "相手デッキタイプ",
        "value": "黄色コントロール（推定確度: 75%）",
        "type": "text"
      },
      {
        "label": "相手の捨札傾向",
        "value": "裁きの光×1、選ばれし者×1が確認済み",
        "type": "card"
      },
      {
        "label": "警戒カード",
        "value": "神の一撃（未使用）、審判の天秤（未使用）",
        "type": "warning"
      },
      {
        "label": "戦略調整",
        "value": "ユニット展開を分散し、一度に2体以上並べない",
        "type": "text"
      },
      {
        "label": "現在の優勢度",
        "value": "互角（ライフ差: +1）",
        "type": "text"
      }
    ]
  },
  "meta": {
    "model": "opus",
    "tokenUsed": 1850,
    "latencyMs": 6200,
    "gameState": {
      "turn": 4,
      "round": 2
    }
  },
  "interaction": {
    "type": "none"
  }
}
```

### 4.3 ターン意思決定 (turn_decision)

```json
{
  "id": "msg-015",
  "timestamp": "2026-01-29T14:36:30.000Z",
  "category": "turn_decision",
  "priority": "medium",
  "content": {
    "title": "ターン5: ユニット召喚",
    "body": "竜騎兵を召喚します。",
    "details": [
      {
        "label": "アクション",
        "value": "竜騎兵（コスト3）をフィールドに召喚",
        "type": "unit"
      },
      {
        "label": "理由",
        "value": "CPを効率的に使用し、盤面プレッシャーを維持。5000BPで相手ユニットとの相打ちが可能。",
        "type": "text"
      },
      {
        "label": "次ターン候補",
        "value": "魔将・信玄の進化で盤面制圧を狙う",
        "type": "text"
      },
      {
        "label": "残りCP",
        "value": "1（最大4）",
        "type": "text"
      }
    ]
  },
  "meta": {
    "model": "sonnet",
    "tokenUsed": 420,
    "latencyMs": 650,
    "gameState": {
      "turn": 5,
      "round": 3
    }
  },
  "interaction": {
    "type": "none"
  }
}
```

### 4.4 選択肢応答 (choice_response)

```json
{
  "id": "msg-018",
  "timestamp": "2026-01-29T14:37:15.000Z",
  "category": "choice_response",
  "priority": "high",
  "content": {
    "title": "ブロッカー選択",
    "body": "魔将・信玄でブロックします。",
    "details": [
      {
        "label": "選択",
        "value": "魔将・信玄（BP 7000）でブロック",
        "type": "unit"
      },
      {
        "label": "対象",
        "value": "蒼炎の魔術師（BP 4000）のアタック",
        "type": "unit"
      },
      {
        "label": "理由",
        "value": "BP差+3000で確実に撃破可能。【不屈】により次ターンもアタック可能。",
        "type": "text"
      },
      {
        "label": "リスク",
        "value": "相手の【インターセプト】に注意。トリガーゾーンにカードあり。",
        "type": "warning"
      }
    ]
  },
  "meta": {
    "model": "haiku",
    "tokenUsed": 180,
    "latencyMs": 220,
    "gameState": {
      "turn": 5,
      "round": 3
    }
  },
  "interaction": {
    "type": "none"
  }
}
```

### 4.5 戦略変更通知 (strategy_update)

```json
{
  "id": "msg-022",
  "timestamp": "2026-01-29T14:40:00.000Z",
  "category": "strategy_update",
  "priority": "high",
  "content": {
    "title": "戦略変更: 守備的モードへ移行",
    "body": "ライフ差が-3となったため、守備的な戦略に切り替えます。",
    "details": [
      {
        "label": "変更理由",
        "value": "ライフ3 vs 6で劣勢。リソース温存を優先。",
        "type": "text"
      },
      {
        "label": "新戦略",
        "value": "ブロック優先、アタックは確実な場面のみ",
        "type": "text"
      },
      {
        "label": "勝ち筋",
        "value": "JOKER発動による逆転、または相手のデッキ切れ",
        "type": "text"
      },
      {
        "label": "JOKERゲージ",
        "value": "4/5（あと1ターンで発動可能）",
        "type": "text"
      }
    ]
  },
  "meta": {
    "model": "sonnet",
    "tokenUsed": 380,
    "latencyMs": 480,
    "gameState": {
      "turn": 8,
      "round": 4
    }
  },
  "interaction": {
    "type": "confirm",
    "options": [
      {
        "id": "accept",
        "label": "承認",
        "description": "守備的戦略を採用"
      },
      {
        "id": "aggressive",
        "label": "攻撃継続",
        "description": "リスクを取って攻撃的に"
      }
    ]
  }
}
```

### 4.6 システムメッセージ (system)

```json
{
  "id": "msg-030",
  "timestamp": "2026-01-29T14:42:00.000Z",
  "category": "system",
  "priority": "low",
  "content": {
    "title": "Opus分析をバックグラウンドで実行中",
    "body": "次の定期分析を準備しています。ゲームプレイに影響はありません。",
    "details": [
      {
        "label": "予定完了",
        "value": "約5秒後",
        "type": "text"
      }
    ]
  },
  "meta": {
    "model": "opus"
  },
  "interaction": {
    "type": "none"
  }
}
```

---

## 5. TOON形式でのメッセージ表現

トークン効率を高めるため、内部通信にはTOON形式を使用可能:

### 5.1 ターン意思決定のTOON表現

```toon
msg:
  id: msg-015
  cat: turn_decision
  pri: medium

content:
  title: ターン5: ユニット召喚
  body: 竜騎兵を召喚します。

details[4]{label,value,type}:
  アクション,竜騎兵（コスト3）をフィールドに召喚,unit
  理由,CPを効率的に使用し盤面プレッシャーを維持,text
  次ターン候補,魔将・信玄の進化で盤面制圧を狙う,text
  残りCP,1（最大4）,text

meta:
  model: sonnet
  tokens: 420
  latency: 650
  turn: 5
  round: 3
```

**削減効果:** JSON比で約45%のトークン削減

---

## 6. UI表示仕様

### 6.1 レイアウト

```
┌─────────────────────────────────────────────────────────────┐
│  ゲーム画面                                                  │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ [AI Chat] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ [−] [×]           │
├─────────────────────────────────────────────────────────────┤
│ [Opus] 14:30 デッキ分析完了                                  │
│   キーカード: 魔将・信玄、進化の秘宝                          │
│   想定プラン: 中盤の進化ラッシュで盤面制圧                    │
│   [この戦略で開始] [再分析] [攻撃的に] [守備的に]             │
├─────────────────────────────────────────────────────────────┤
│ [Sonnet] 14:36 ターン5: 竜騎兵を召喚                         │
│   理由: CPを効率的に使用                                     │
├─────────────────────────────────────────────────────────────┤
│ [Haiku] 14:37 ブロッカー選択: 魔将・信玄                     │
│   理由: BP差+3000で確実撃破                                  │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 表示オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| 表示位置 | bottom / right / floating | bottom |
| 高さ | compact / normal / expanded | normal |
| 詳細表示 | 全詳細 / 要約のみ | 要約のみ |
| モデルバッジ | 表示 / 非表示 | 表示 |
| 自動スクロール | 有効 / 無効 | 有効 |

### 6.3 カラーコード

| 優先度 | 背景色 | 用途 |
|--------|-------|------|
| high | `#FEE2E2` (赤系) | 重要な戦略変更、警告 |
| medium | `#FEF3C7` (黄系) | 通常の意思決定 |
| low | `#E0E7FF` (青系) | システム通知、情報 |

---

## 7. ユーザーインタラクション

### 7.1 フィードバックタイプ

| タイプ | 説明 | 応答形式 |
|--------|------|----------|
| `confirm` | 承認/拒否 | ボタンクリック |
| `choice` | 複数選択肢から選択 | ボタンクリック |
| `rating` | 評価 (1-5) | スター選択 |
| `text` | 自由記述 | テキスト入力 |

### 7.2 フィードバック応答オブジェクト

```typescript
interface UserFeedback {
  messageId: string;
  interactionType: "confirm" | "choice" | "rating" | "text";
  response: {
    selected?: string;      // confirm/choice の場合
    rating?: number;        // rating の場合 (1-5)
    text?: string;          // text の場合
  };
  timestamp: Date;
}
```

### 7.3 フィードバック例

```json
{
  "messageId": "msg-001",
  "interactionType": "confirm",
  "response": {
    "selected": "aggressive"
  },
  "timestamp": "2026-01-29T14:30:15.000Z"
}
```

### 7.4 ユーザーチャットメッセージ

承認/選択以外の自由なメッセージをユーザーが送信可能:

#### メッセージオブジェクト

```typescript
interface UserChatMessage {
  id: string;
  timestamp: Date;
  content: string;
  threadTarget: "game_session" | "pregame" | "periodic";
}

interface AIConversationResponse {
  id: string;
  timestamp: Date;
  category: "user_response";
  priority: "medium";
  content: {
    title: "ユーザーへの応答";
    body: string;
    details?: ContentDetail[];
  };
  meta: {
    model: "sonnet" | "opus";  // ユーザーメッセージにはSonnet以上
    tokenUsed: number;
    inResponseTo: string;      // 元のユーザーメッセージID
  };
  knowledgeExtracted?: {
    stored: boolean;
    entry?: KnowledgeEntrySummary;
  };
}

interface KnowledgeEntrySummary {
  topic: string;
  insight: string;
  type: "preference" | "strategy" | "correction" | "insight";
}
```

#### ユーザーメッセージ例

```json
{
  "id": "user-msg-001",
  "timestamp": "2026-01-29T14:38:00.000Z",
  "content": "この対戦相手は毎回インターセプトを温存してくる傾向があるから、もっと警戒して",
  "threadTarget": "game_session"
}
```

#### AI応答例

```json
{
  "id": "msg-025",
  "timestamp": "2026-01-29T14:38:02.000Z",
  "category": "user_response",
  "priority": "medium",
  "content": {
    "title": "ユーザーへの応答",
    "body": "了解しました。相手のインターセプト温存傾向を考慮し、以下の対策を取ります：",
    "details": [
      {
        "label": "戦略調整",
        "value": "アタック前に相手の手札枚数とCPを確認し、インターセプト発動の可能性を重視",
        "type": "text"
      },
      {
        "label": "リスク回避",
        "value": "重要ユニットでの単独アタックを控え、複数アタックで誘発を狙う",
        "type": "text"
      }
    ]
  },
  "meta": {
    "model": "sonnet",
    "tokenUsed": 320,
    "inResponseTo": "user-msg-001"
  },
  "knowledgeExtracted": {
    "stored": true,
    "entry": {
      "topic": "対戦相手の傾向",
      "insight": "インターセプトを温存する傾向がある。アタック時は警戒を強化。",
      "type": "insight"
    }
  }
}
```

### 7.5 バックグラウンドスレッドアクセス

Pregame/Periodicスレッドへの直接アクセスUI:

#### スレッドステータス表示

```typescript
interface BackgroundThreadStatus {
  type: "pregame" | "periodic";
  status: "idle" | "running" | "completed" | "error";
  progress?: number;
  lastResult?: {
    timestamp: Date;
    summary: string;
  };
  canInteract: boolean;
}
```

#### バックグラウンドスレッドへのメッセージ例

```json
{
  "id": "user-msg-002",
  "timestamp": "2026-01-29T14:45:00.000Z",
  "content": "相手のデッキについてもう少し詳しく分析して",
  "threadTarget": "periodic"
}
```

#### バックグラウンドスレッドUI表示

```
┌─────────────────────────────────────────────────────────────┐
│ [定期分析スレッド]                              [展開] [×]  │
├─────────────────────────────────────────────────────────────┤
│ Status: 分析完了 (14:35)                                     │
│ 次回分析: ラウンド4終了時                                    │
├─────────────────────────────────────────────────────────────┤
│ [Opus] 最新分析結果:                                         │
│   相手デッキ: 黄色コントロール (確度75%)                      │
│   警戒カード: 神の一撃、審判の天秤                            │
├─────────────────────────────────────────────────────────────┤
│ [入力] 追加で分析してほしいことを入力...           [送信]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 7.6 ゲームイベント表示 (DisplayEffect/VisualEvent)

ゲーム中のエフェクトイベントをチャットに軽量表示:

### イベントメッセージカテゴリ

```typescript
interface GameEventMessage {
  id: string;
  timestamp: Date;
  category: "game_event";
  priority: "low";
  content: {
    title: string;          // 例: "効果発動", "トリガー発動"
    body: string;           // 例: "裁きの光 → 竜騎兵を破壊"
  };
  meta: {
    eventType: "display_effect" | "visual_effect" | "trigger";
    source?: string;        // 発動元カード名
    target?: string;        // 対象カード名
    gameState: {
      turn: number;
      round: number;
    };
  };
}
```

### イベント表示例

```json
{
  "id": "evt-001",
  "timestamp": "2026-01-29T14:36:45.000Z",
  "category": "game_event",
  "priority": "low",
  "content": {
    "title": "効果発動",
    "body": "【不屈】: 魔将・信玄 → 行動権回復"
  },
  "meta": {
    "eventType": "display_effect",
    "source": "魔将・信玄",
    "gameState": {
      "turn": 5,
      "round": 3
    }
  }
}
```

```json
{
  "id": "evt-002",
  "timestamp": "2026-01-29T14:37:20.000Z",
  "category": "game_event",
  "priority": "low",
  "content": {
    "title": "インターセプト",
    "body": "裁きの光 → 竜騎兵を破壊"
  },
  "meta": {
    "eventType": "display_effect",
    "source": "裁きの光",
    "target": "竜騎兵",
    "gameState": {
      "turn": 5,
      "round": 3
    }
  }
}
```

### イベント表示設定

| 設定 | 説明 | デフォルト |
|------|------|-----------|
| showGameEvents | イベントを表示するか | true |
| eventDetailLevel | "full" / "minimal" / "none" | "minimal" |
| groupSimilarEvents | 連続する同種イベントをグループ化 | true |
| eventOpacity | イベントメッセージの透明度 (0-1) | 0.7 |

### チャット内イベント表示イメージ

```
┌─────────────────────────────────────────────────────────────┐
│ [Sonnet] 14:36 ターン5: 竜騎兵を召喚                         │
│   理由: CPを効率的に使用                                     │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│   [evt] 【貫通】: 竜騎兵に付与                               │
├─────────────────────────────────────────────────────────────┤
│ [Haiku] 14:37 ブロッカー選択: 魔将・信玄                     │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│   [evt] 裁きの光 → 竜騎兵を破壊                              │
│   [evt] 【不屈】: 魔将・信玄 → 行動権回復                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 状態管理

### 8.1 Zustandストア定義

```typescript
interface AIChatStore {
  // メッセージ履歴
  messages: AIChatMessage[];

  // 表示設定
  settings: {
    position: "bottom" | "right" | "floating";
    height: "compact" | "normal" | "expanded";
    detailLevel: "full" | "summary";
    showModelBadge: boolean;
    autoScroll: boolean;
    isVisible: boolean;
  };

  // 未読管理
  unreadCount: number;
  lastReadTimestamp: Date | null;

  // アクション
  addMessage: (message: AIChatMessage) => void;
  updateMessage: (id: string, update: Partial<AIChatMessage>) => void;
  submitFeedback: (feedback: UserFeedback) => void;
  clearMessages: () => void;
  updateSettings: (settings: Partial<AIChatStore['settings']>) => void;
  markAsRead: () => void;
}
```

---

## 9. ファイル構成

```
/src/components/ai/
├── AIChat.tsx                     # メインコンテナ
├── AIChatHeader.tsx               # ヘッダー（最小化/閉じるボタン）
├── AIChatMessageList.tsx          # メッセージリスト
├── AIChatMessage.tsx              # 個別メッセージ
├── AIChatMessageDetail.tsx        # 詳細展開表示
├── AIChatInteraction.tsx          # ユーザーインタラクション
├── AIChatModelBadge.tsx           # モデルバッジ (Haiku/Sonnet/Opus)
├── AIChatSettings.tsx             # 設定パネル
├── AIChatInput.tsx                # ユーザーメッセージ入力
├── AIChatGameEvent.tsx            # ゲームイベント表示
├── AIChatBackgroundThread.tsx     # バックグラウンドスレッドUI
└── hooks/
    ├── useAIChatStore.ts          # Zustandストア
    ├── useAIChatMessages.ts       # メッセージ管理
    ├── useAIChatSettings.ts       # 設定管理
    ├── useUserMessage.ts          # ユーザーメッセージ処理
    ├── useBackgroundThread.ts     # バックグラウンドスレッドアクセス
    └── useKnowledgeStore.ts       # Knowledge LocalStorage管理

/src/ai/
├── chat/
│   ├── types.ts                   # メッセージ型定義
│   ├── formatter.ts               # メッセージフォーマット
│   ├── toon.ts                    # TOON変換ユーティリティ
│   └── eventConverter.ts          # DisplayEffect/VisualEvent変換
│
├── thread/
│   ├── types.ts                   # スレッド型定義
│   ├── ThreadManager.ts           # スレッド管理
│   ├── GameSessionThread.ts       # メインゲームスレッド
│   ├── PregameThread.ts           # ゲーム開始前分析スレッド
│   ├── PeriodicThread.ts          # 定期分析スレッド
│   └── ContextWindowManager.ts    # コンテキストウィンドウ管理
│
└── knowledge/
    ├── types.ts                   # Knowledge型定義
    ├── KnowledgeStore.ts          # LocalStorage管理
    ├── KnowledgeExtractor.ts      # 会話からの知識抽出
    └── KnowledgeInjector.ts       # プロンプトへの知識注入
```

---

## 10. 実装優先順位

| Phase | 機能 | 優先度 |
|-------|------|--------|
| 1 | 基本メッセージ表示 | P0 |
| 1 | ターン意思決定表示 | P0 |
| 1 | 表示/非表示切り替え | P0 |
| 1 | ゲームイベント表示 (DisplayEffect/VisualEvent) | P1 |
| 2 | ゲーム開始前分析 + フィードバック | P0 |
| 2 | 定期分析表示 | P1 |
| 2 | 詳細展開表示 | P1 |
| 2 | ユーザーメッセージ入力 + AI応答 | P1 |
| 3 | バックグラウンドスレッドUI | P1 |
| 3 | Knowledge Storage (LocalStorage) | P2 |
| 3 | 設定パネル | P2 |
| 3 | 位置変更 | P2 |
| 3 | メッセージ履歴エクスポート | P3 |

---

## 付録A: 全メッセージタイプの概要

| Category | 頻度 | モデル | 優先度 | インタラクション |
|----------|------|--------|--------|-----------------|
| pregame_analysis | 1回/ゲーム | Opus | high | confirm/choice |
| periodic_analysis | 1回/2ラウンド | Opus | medium | none |
| turn_decision | 複数回/ターン | Sonnet | medium | none |
| choice_response | 随時 | Haiku | medium-high | none |
| strategy_update | 状況に応じて | Sonnet | high | confirm |
| feedback_request | 随時 | - | high | choice/text |
| user_response | ユーザー入力時 | Sonnet/Opus | medium | none |
| game_event | イベント発生時 | - | low | none |
| system | 随時 | - | low | none |
