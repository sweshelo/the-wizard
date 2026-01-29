// src/ai/prompts/action.ts

import type { AIGameContext, AIActionType } from '../types';

/**
 * アクション決定用のシステムプロンプト
 */
export const ACTION_SYSTEM_PROMPT = `あなたはCODE OF JOKERのAIプレイヤーです。
現在のターンで実行するアクションを決定してください。

## 可能なアクション

- UnitDrive: ユニットを手札からフィールドに召喚
- AttackWithUnit: ユニットでアタック
- UseIntercept: インターセプトカードを使用
- UseTrigger: トリガーカードを使用
- UseJoker: ジョーカーカードを使用
- TurnEnd: ターンを終了

## アクション選択の基準

1. CPを効率的に使用する
2. 盤面のアドバンテージを取る
3. ライフを守る
4. 勝利条件を意識する

## 応答形式

必ず以下のJSON形式で応答してください:
\`\`\`json
{
  "action": "アクション名",
  "targetId": "対象の短縮ID（必要な場合）",
  "reason": "判断理由を簡潔に"
}
\`\`\`
`;

/**
 * アクション決定用のユーザーメッセージを生成
 */
export function buildActionPrompt(context: AIGameContext): string {
  const sections: string[] = [];

  // ゲーム状況
  sections.push(formatGameSituation(context));

  // フィールド状況
  sections.push(formatFieldSituation(context));

  // 手札情報
  sections.push(formatHandSituation(context));

  // 質問
  sections.push(`## 質問

現在のターンで実行するアクションを決定してください。
CPを効率的に使い、盤面のアドバンテージを取ることを意識してください。
JSON形式で回答してください。`);

  return sections.join('\n\n');
}

/**
 * ゲーム状況をフォーマット
 */
function formatGameSituation(context: AIGameContext): string {
  return `## ゲーム状況

- ターン: ${context.turn} / ラウンド: ${context.round}
- 自分: ライフ ${context.self.life} / CP ${context.self.cp.current}/${context.self.cp.max} / ジョーカー ${context.self.jokerGauge}
- 相手: ライフ ${context.opponent.life} / CP ${context.opponent.cp.current}/${context.opponent.cp.max} / ジョーカー ${context.opponent.jokerGauge}`;
}

/**
 * フィールド状況をフォーマット
 */
function formatFieldSituation(context: AIGameContext): string {
  const myFieldStr =
    context.myField.length > 0
      ? context.myField
          .map(
            u => `  - [${u.id}] ${u.name} BP:${u.bp} ${u.active ? '(アクティブ)' : '(行動済み)'}`
          )
          .join('\n')
      : '  （なし）';

  const oppFieldStr =
    context.opponentField.length > 0
      ? context.opponentField
          .map(
            u => `  - [${u.id}] ${u.name} BP:${u.bp} ${u.active ? '(アクティブ)' : '(行動済み)'}`
          )
          .join('\n')
      : '  （なし）';

  return `## フィールド状況

### 自分のフィールド
${myFieldStr}

### 相手のフィールド
${oppFieldStr}`;
}

/**
 * 手札状況をフォーマット
 */
function formatHandSituation(context: AIGameContext): string {
  const handStr =
    context.myHand.length > 0
      ? context.myHand
          .map(c => {
            const playableStr = c.playable ? '(プレイ可能)' : '(プレイ不可)';
            return `  - [${c.id}] ${c.name} コスト:${c.cost} ${playableStr}`;
          })
          .join('\n')
      : '  （なし）';

  return `## 手札 (${context.myHand.length}枚)

${handStr}`;
}

/**
 * アクションレスポンスの型
 */
export interface ActionPromptResponse {
  action: AIActionType;
  targetId?: string;
  reason: string;
}
