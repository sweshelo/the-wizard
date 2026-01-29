// src/ai/prompts/choice.ts

import type { AIGameContext, CompactCard, CompactUnit } from '../types';

/**
 * 選択肢応答用のシステムプロンプト
 */
export const CHOICE_SYSTEM_PROMPT = `あなたはCODE OF JOKERのAIプレイヤーです。
提示された選択肢から最適なものを選んでください。

## 選択の基準

1. 盤面のアドバンテージを最大化する
2. リスクを最小化する
3. 長期的な勝利を見据える

## 応答形式

必ず以下のJSON形式で応答してください:
\`\`\`json
{
  "selectedIds": ["選択したIDの配列"],
  "reason": "選択理由を簡潔に"
}
\`\`\`

選択をキャンセルする場合は空配列を返してください:
\`\`\`json
{
  "selectedIds": [],
  "reason": "キャンセル理由"
}
\`\`\`
`;

/**
 * オプション選択用のプロンプトを生成
 */
export function buildOptionChoicePrompt(
  context: AIGameContext,
  options: Array<{ id: string; description: string }>,
  title?: string
): string {
  const optionsStr = options.map(opt => `  - [${opt.id}] ${opt.description}`).join('\n');

  return `## 現在の状況

- ターン: ${context.turn} / ラウンド: ${context.round}
- 自分ライフ: ${context.self.life} / 相手ライフ: ${context.opponent.life}

## 選択肢${title ? `: ${title}` : ''}

${optionsStr}

## 質問

上記の選択肢から1つ選んでください。
JSON形式で回答してください。`;
}

/**
 * カード選択用のプロンプトを生成
 */
export function buildCardChoicePrompt(
  context: AIGameContext,
  cards: CompactCard[],
  count: number,
  title?: string
): string {
  const cardsStr = cards
    .map(card => `  - [${card.id}] ${card.name} コスト:${card.cost} タイプ:${card.type}`)
    .join('\n');

  return `## 現在の状況

- ターン: ${context.turn} / ラウンド: ${context.round}
- 自分ライフ: ${context.self.life} / 相手ライフ: ${context.opponent.life}

## カード選択${title ? `: ${title}` : ''}

選択可能なカード:
${cardsStr}

選択枚数: ${count}枚

## 質問

上記のカードから${count}枚選んでください。
JSON形式で回答してください。`;
}

/**
 * ユニット選択用のプロンプトを生成
 */
export function buildUnitChoicePrompt(
  context: AIGameContext,
  units: CompactUnit[],
  title?: string,
  isCancelable: boolean = false
): string {
  const unitsStr = units
    .map(unit => {
      const abilities = unit.abilities.length > 0 ? ` [${unit.abilities.join(', ')}]` : '';
      return `  - [${unit.id}] ${unit.name} BP:${unit.bp}${abilities}`;
    })
    .join('\n');

  const cancelNote = isCancelable ? '\n\n※ 選択をキャンセルすることも可能です（空配列を返す）' : '';

  return `## 現在の状況

- ターン: ${context.turn} / ラウンド: ${context.round}
- 自分ライフ: ${context.self.life} / 相手ライフ: ${context.opponent.life}

## ユニット選択${title ? `: ${title}` : ''}

選択可能なユニット:
${unitsStr}${cancelNote}

## 質問

上記のユニットから1体選んでください。
JSON形式で回答してください。`;
}

/**
 * ブロッカー選択用のプロンプトを生成
 */
export function buildBlockChoicePrompt(
  context: AIGameContext,
  blockers: CompactUnit[],
  attackerInfo?: { name: string; bp: number }
): string {
  const blockersStr = blockers
    .map(unit => {
      const abilities = unit.abilities.length > 0 ? ` [${unit.abilities.join(', ')}]` : '';
      return `  - [${unit.id}] ${unit.name} BP:${unit.bp}${abilities}`;
    })
    .join('\n');

  const attackerNote = attackerInfo
    ? `\n\nアタッカー: ${attackerInfo.name} (BP: ${attackerInfo.bp})`
    : '';

  return `## 現在の状況

- ターン: ${context.turn} / ラウンド: ${context.round}
- 自分ライフ: ${context.self.life} / 相手ライフ: ${context.opponent.life}${attackerNote}

## ブロッカー選択

ブロック可能なユニット:
${blockersStr}

※ ブロックしない場合は空配列を返してください

## 質問

ブロックするユニットを選んでください。
BP比較を考慮し、有利なトレードができるか判断してください。
JSON形式で回答してください。`;
}

/**
 * インターセプト選択用のプロンプトを生成
 */
export function buildInterceptChoicePrompt(
  context: AIGameContext,
  intercepts: CompactCard[]
): string {
  const interceptsStr = intercepts
    .map(card => `  - [${card.id}] ${card.name} コスト:${card.cost}`)
    .join('\n');

  return `## 現在の状況

- ターン: ${context.turn} / ラウンド: ${context.round}
- 自分ライフ: ${context.self.life} / 相手ライフ: ${context.opponent.life}

## インターセプト選択

使用可能なインターセプト:
${interceptsStr}

※ 使用しない場合は空配列を返してください

## 質問

インターセプトを使用しますか？
状況に応じて温存するか使用するか判断してください。
JSON形式で回答してください。`;
}

/**
 * 選択肢レスポンスの型
 */
export interface ChoicePromptResponse {
  selectedIds: string[];
  reason: string;
}
