// src/ai/prompts/mulligan.ts

import type { AIGameContext, CompactCard } from '../types';

/**
 * マリガン判断用のシステムプロンプト
 */
export const MULLIGAN_SYSTEM_PROMPT = `あなたはCODE OF JOKERのAIプレイヤーです。
マリガン（手札の引き直し）をするかどうか判断してください。

## マリガンの判断基準

良い手札の条件:
- 序盤に出せる低コスト（1-3）ユニットがある
- コスト分布が偏っていない
- 高コスト（5以上）カードが多すぎない

悪い手札の条件:
- 序盤に何も出せない（低コストユニットがない）
- 高コストカードばかり
- 特定のコスト帯に偏っている

## 応答形式

必ず以下のJSON形式で応答してください:
\`\`\`json
{
  "shouldMulligan": true または false,
  "reason": "判断理由を簡潔に"
}
\`\`\`
`;

/**
 * マリガン判断用のユーザーメッセージを生成
 */
export function buildMulliganPrompt(context: AIGameContext): string {
  const handDescription = formatHand(context.myHand);

  return `## 現在の手札

${handDescription}

## 質問

この手札でゲームを開始しますか？それともマリガン（引き直し）しますか？
JSON形式で回答してください。`;
}

/**
 * 手札をフォーマット
 */
function formatHand(hand: CompactCard[]): string {
  if (hand.length === 0) {
    return '（手札なし）';
  }

  const lines = hand.map(card => {
    const typeLabel = getTypeLabel(card.type);
    return `- ${card.name} [${typeLabel}] コスト: ${card.cost}`;
  });

  // コスト分布を追加
  const costDistribution = analyzeCostDistribution(hand);

  return `${lines.join('\n')}

### コスト分布
${costDistribution}`;
}

/**
 * カードタイプのラベルを取得
 */
function getTypeLabel(type: CompactCard['type']): string {
  const labels: Record<CompactCard['type'], string> = {
    unit: 'ユニット',
    trigger: 'トリガー',
    intercept: 'インターセプト',
    advanced_unit: '進化ユニット',
    virus: 'ウイルス',
    joker: 'ジョーカー',
  };
  return labels[type] ?? type;
}

/**
 * コスト分布を分析
 */
function analyzeCostDistribution(hand: CompactCard[]): string {
  const distribution: Record<string, number> = {
    '0-2': 0,
    '3-4': 0,
    '5+': 0,
  };

  for (const card of hand) {
    if (card.cost <= 2) {
      distribution['0-2']++;
    } else if (card.cost <= 4) {
      distribution['3-4']++;
    } else {
      distribution['5+']++;
    }
  }

  return Object.entries(distribution)
    .map(([range, count]) => `コスト${range}: ${count}枚`)
    .join('\n');
}

/**
 * マリガンレスポンスの型
 */
export interface MulliganPromptResponse {
  shouldMulligan: boolean;
  reason: string;
}
