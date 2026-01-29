// src/ai/prompts/pregame.ts
import { getColorName } from './strategy';
import pregamePrompt from '../../../prompt/pregame.md';

/**
 * デッキ内カード情報
 */
export interface DeckCardInfo {
  catalogId: string;
  name: string;
  type: 'unit' | 'trigger' | 'intercept' | 'advanced_unit' | 'virus' | 'joker';
  cost: number;
  count: number;
}

/**
 * デッキ情報
 */
export interface DeckInfo {
  cards: DeckCardInfo[];
  colors: number[];
  totalCards: number;
}

/**
 * ゲーム開始前分析用システムプロンプト
 */
export const PREGAME_SYSTEM_PROMPT = pregamePrompt;

/**
 * ゲーム開始前分析のレスポンス型
 */
export interface PregamePromptResponse {
  deckArchetype: string;
  keyCards: string[];
  strategy: string;
  mulliganAdvice: string;
  strengths: string[];
  weaknesses: string[];
  matchupNotes: string;
}

/**
 * ゲーム開始前分析用プロンプトを構築
 */
export function buildPregamePrompt(deckInfo: DeckInfo): string {
  const sections: string[] = [];

  // カラー情報
  const colorNames = deckInfo.colors.map(c => getColorName(c)).join('/');
  sections.push(`## デッキ構成\n\n**デッキカラー:** ${colorNames}`);
  sections.push(`**総カード枚数:** ${deckInfo.totalCards}枚`);

  // カードタイプ別
  const units = deckInfo.cards.filter(c => c.type === 'unit' || c.type === 'advanced_unit');
  const triggers = deckInfo.cards.filter(c => c.type === 'trigger');
  const intercepts = deckInfo.cards.filter(c => c.type === 'intercept');

  const unitTotal = units.reduce((sum, c) => sum + c.count, 0);
  const triggerTotal = triggers.reduce((sum, c) => sum + c.count, 0);
  const interceptTotal = intercepts.reduce((sum, c) => sum + c.count, 0);

  sections.push(
    `\n**構成:** ユニット ${unitTotal}枚 / トリガー ${triggerTotal}枚 / インターセプト ${interceptTotal}枚`
  );

  // ユニット一覧
  if (units.length > 0) {
    sections.push('\n### ユニット');
    for (const card of units.sort((a, b) => a.cost - b.cost)) {
      sections.push(`- ${card.name} (コスト${card.cost}) x${card.count}枚`);
    }
  }

  // トリガー一覧
  if (triggers.length > 0) {
    sections.push('\n### トリガー');
    for (const card of triggers.sort((a, b) => a.cost - b.cost)) {
      sections.push(`- ${card.name} (コスト${card.cost}) x${card.count}枚`);
    }
  }

  // インターセプト一覧
  if (intercepts.length > 0) {
    sections.push('\n### インターセプト');
    for (const card of intercepts.sort((a, b) => a.cost - b.cost)) {
      sections.push(`- ${card.name} (コスト${card.cost}) x${card.count}枚`);
    }
  }

  // 分析依頼
  sections.push(`\n## 分析依頼\n
このデッキを分析し、以下について教えてください:
1. デッキアーキタイプ（アグロ/ミッドレンジ/コントロールなど）
2. キーカード（重要なカード）
3. 基本戦略
4. マリガン指針
5. 強みと弱み

JSON形式で回答してください。`);

  return sections.join('\n');
}
