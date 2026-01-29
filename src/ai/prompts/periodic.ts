// src/ai/prompts/periodic.ts

import type { AIGameContext } from '../types';

/**
 * 定期分析用のシステムプロンプト
 */
export function buildPeriodicAnalysisSystemPrompt(): string {
  return `あなたはカードゲーム「CODE OF JOKER」の戦略アナリストです。
ゲームの進行状況を定期的に分析し、戦略的なアドバイスを提供します。

## 分析の観点
1. 盤面状況の評価（有利/不利/互角）
2. リソース状況の比較（ライフ、手札、CP）
3. 相手のプレイパターンの傾向
4. 今後の展開予測
5. 戦略の調整提案

## 出力形式
JSON形式で以下の構造で出力してください:
{
  "boardEvaluation": "有利" | "不利" | "互角",
  "evaluationScore": -10 to 10,
  "keyObservations": ["観察1", "観察2", ...],
  "threatLevel": "低" | "中" | "高" | "危険",
  "strategySuggestion": "戦略提案",
  "nextRoundPriorities": ["優先事項1", "優先事項2", ...]
}`;
}

/**
 * 定期分析用のユーザープロンプトを構築
 */
export function buildPeriodicAnalysisPrompt(
  context: AIGameContext,
  previousAnalysis?: string
): string {
  const lines: string[] = [];

  lines.push('## 現在のゲーム状況');
  lines.push(`ラウンド: ${context.round} / ターン: ${context.turn}`);
  lines.push(`自分のターン: ${context.isMyTurn ? 'はい' : 'いいえ'}`);
  lines.push('');

  // 自分の状況
  lines.push('### 自分の状況');
  lines.push(`ライフ: ${context.self.life}`);
  lines.push(`CP: ${context.self.cp.current}/${context.self.cp.max}`);
  lines.push(`手札: ${context.myHand.length}枚`);
  lines.push(`フィールド: ${context.myField.length}体`);

  if (context.myField.length > 0) {
    lines.push('フィールドユニット:');
    for (const unit of context.myField) {
      const status = unit.active ? '攻撃可' : '攻撃不可';
      lines.push(`  - ${unit.name} (BP: ${unit.bp}, ${status})`);
    }
  }
  lines.push('');

  // 相手の状況
  lines.push('### 相手の状況');
  lines.push(`ライフ: ${context.opponent.life}`);
  lines.push(`手札: ${context.opponent.handCount}枚`);
  lines.push(`フィールド: ${context.opponentField.length}体`);

  if (context.opponentField.length > 0) {
    lines.push('フィールドユニット:');
    for (const unit of context.opponentField) {
      lines.push(`  - ${unit.name} (BP: ${unit.bp})`);
    }
  }
  lines.push('');

  // 前回の分析があれば含める
  if (previousAnalysis) {
    lines.push('### 前回の分析');
    lines.push(previousAnalysis);
    lines.push('');
  }

  lines.push('上記の状況を分析し、戦略的なアドバイスをJSON形式で出力してください。');

  return lines.join('\n');
}

/**
 * 分析結果の型
 */
export interface PeriodicAnalysisResult {
  boardEvaluation: '有利' | '不利' | '互角';
  evaluationScore: number;
  keyObservations: string[];
  threatLevel: '低' | '中' | '高' | '危険';
  strategySuggestion: string;
  nextRoundPriorities: string[];
}

/**
 * 分析結果をパース
 */
export function parsePeriodicAnalysisResult(content: string): PeriodicAnalysisResult | null {
  try {
    // JSONブロックを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as PeriodicAnalysisResult;

    // 必須フィールドの検証
    if (
      !parsed.boardEvaluation ||
      typeof parsed.evaluationScore !== 'number' ||
      !Array.isArray(parsed.keyObservations)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
