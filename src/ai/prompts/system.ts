// src/ai/prompts/system.ts

import systemPrompt from '../../../prompt/system.md';
import gameStateDescriptionPrompt from '../../../prompt/game-state-description.md';

/**
 * CODE OF JOKER AI の基本システムプロンプト
 */
export const SYSTEM_PROMPT = systemPrompt;

/**
 * ゲーム状態の説明を生成
 */
export function formatGameStateDescription(): string {
  return gameStateDescriptionPrompt;
}

/**
 * モデル別のシステムプロンプトを取得
 */
export function getSystemPrompt(detailed: boolean = false): string {
  if (detailed) {
    return SYSTEM_PROMPT + '\n' + formatGameStateDescription();
  }
  return SYSTEM_PROMPT;
}
