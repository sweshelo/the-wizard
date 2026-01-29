// src/ai/prompts/strategy.ts

import redStrategy from '../../../prompt/strategy/red.md';
import yellowStrategy from '../../../prompt/strategy/yellow.md';
import blueStrategy from '../../../prompt/strategy/blue.md';
import greenStrategy from '../../../prompt/strategy/green.md';
import purpleStrategy from '../../../prompt/strategy/purple.md';

/**
 * デッキの色構成
 */
export interface DeckColors {
  /** メインカラー */
  primary: number;
  /** サブカラー（2色デッキの場合） */
  secondary?: number;
}

/**
 * 色別戦略情報
 */
export interface ColorStrategy {
  /** 色名 */
  name: string;
  /** プレイスタイル */
  playstyle: string;
  /** 強み */
  strengths: string[];
  /** 弱み */
  weaknesses: string[];
  /** 戦略的アドバイス */
  tips: string[];
}

/**
 * 色番号から色名を取得
 */
export function getColorName(color: number): string {
  const colorNames: Record<number, string> = {
    1: '赤',
    2: '黄',
    3: '青',
    4: '緑',
    5: '紫',
  };
  return colorNames[color] ?? '不明';
}

/**
 * Markdownファイルから戦略情報をパース
 */
function parseStrategyMarkdown(markdown: string): ColorStrategy {
  const lines = markdown.split('\n');
  let name = '';
  let playstyle = '';
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const tips: string[] = [];

  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // セクションヘッダーを検出
    if (trimmed.startsWith('# ')) {
      name = trimmed.slice(2).trim();
    } else if (trimmed.startsWith('## ')) {
      currentSection = trimmed.slice(3).trim();
    } else if (trimmed.startsWith('- ')) {
      const item = trimmed.slice(2).trim();
      if (currentSection === '強み') {
        strengths.push(item);
      } else if (currentSection === '弱み') {
        weaknesses.push(item);
      } else if (currentSection === '戦略的アドバイス') {
        tips.push(item);
      }
    } else if (currentSection === 'プレイスタイル' && trimmed.length > 0) {
      playstyle = trimmed;
    }
  }

  return { name, playstyle, strengths, weaknesses, tips };
}

/**
 * 色別戦略マップ
 */
export const COLOR_STRATEGIES: Record<number, ColorStrategy> = {
  1: parseStrategyMarkdown(redStrategy),
  2: parseStrategyMarkdown(yellowStrategy),
  3: parseStrategyMarkdown(blueStrategy),
  4: parseStrategyMarkdown(greenStrategy),
  5: parseStrategyMarkdown(purpleStrategy),
};

/**
 * 色から戦略情報を取得
 */
export function getColorStrategy(color: number): ColorStrategy | null {
  return COLOR_STRATEGIES[color] ?? null;
}

/**
 * デッキ戦略をフォーマット
 */
export function formatDeckStrategy(colors: DeckColors): string {
  const sections: string[] = [];
  const primaryStrategy = getColorStrategy(colors.primary);

  if (!primaryStrategy) {
    return `## デッキ戦略\n\nメインカラー: ${getColorName(colors.primary)}（戦略情報なし）`;
  }

  // メインカラー
  sections.push(`## デッキ戦略`);

  if (colors.secondary) {
    const secondaryStrategy = getColorStrategy(colors.secondary);
    sections.push(`\n### メインカラー: ${primaryStrategy.name}`);
    sections.push(`**プレイスタイル:** ${primaryStrategy.playstyle}`);

    if (secondaryStrategy) {
      sections.push(`\n### サブカラー: ${secondaryStrategy.name}`);
      sections.push(`**プレイスタイル:** ${secondaryStrategy.playstyle}`);
    }
  } else {
    sections.push(`\n### カラー: ${primaryStrategy.name}`);
    sections.push(`**プレイスタイル:** ${primaryStrategy.playstyle}`);
  }

  // 強み
  sections.push(`\n### 強み`);
  for (const strength of primaryStrategy.strengths) {
    sections.push(`- ${strength}`);
  }

  // 弱み
  sections.push(`\n### 弱み`);
  for (const weakness of primaryStrategy.weaknesses) {
    sections.push(`- ${weakness}`);
  }

  // アドバイス
  sections.push(`\n### 戦略的アドバイス`);
  for (const tip of primaryStrategy.tips) {
    sections.push(`- ${tip}`);
  }

  return sections.join('\n');
}

/**
 * 戦略プロンプトを生成（ゲームコンテキスト用）
 */
export function buildStrategyPrompt(deckColors: DeckColors): string {
  return formatDeckStrategy(deckColors);
}
