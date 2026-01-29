// src/ai/toon/index.ts

import { encode, decode } from '@toon-format/toon';
import type { AIGameContext } from '../types';

/**
 * ゲーム状態をTOON形式に変換
 * @param context AIゲームコンテキスト
 * @returns TOON形式の文字列
 */
export function toTOON(context: AIGameContext): string {
  return encode(context);
}

/**
 * TOON形式からゲーム状態に復元
 * @param toon TOON形式の文字列
 * @returns AIゲームコンテキスト（部分的）
 */
export function fromTOON(toon: string): Partial<AIGameContext> {
  return decode(toon) as Partial<AIGameContext>;
}

/**
 * トークン数を推定（日本語対応）
 * @param text テキスト
 * @returns 推定トークン数
 */
export function estimateTokenCount(text: string): number {
  let japaneseChars = 0;
  let otherChars = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);
    const isJapanese =
      (code >= 0x3040 && code <= 0x309f) || // ひらがな
      (code >= 0x30a0 && code <= 0x30ff) || // カタカナ
      (code >= 0x4e00 && code <= 0x9fff) || // CJK統合漢字
      (code >= 0xff00 && code <= 0xffef); // 全角記号

    if (isJapanese) {
      japaneseChars++;
    } else {
      otherChars++;
    }
  }

  // 日本語は約1.5文字で1トークン、英語は約4文字で1トークン
  return Math.ceil(japaneseChars / 1.5 + otherChars / 4);
}

/**
 * トークン削減率を計算
 * @param context AIゲームコンテキスト
 * @returns 削減率（0-1）
 */
export function getTokenReduction(context: AIGameContext): number {
  const jsonString = JSON.stringify(context);
  const toonString = toTOON(context);

  const jsonTokens = estimateTokenCount(jsonString);
  const toonTokens = estimateTokenCount(toonString);

  if (jsonTokens === 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, 1 - toonTokens / jsonTokens));
}

/**
 * 圧縮統計情報を取得
 */
export function getCompressionStats(context: AIGameContext): {
  jsonLength: number;
  toonLength: number;
  jsonTokens: number;
  toonTokens: number;
  lengthReduction: number;
  tokenReduction: number;
} {
  const jsonString = JSON.stringify(context);
  const toonString = toTOON(context);

  const jsonTokens = estimateTokenCount(jsonString);
  const toonTokens = estimateTokenCount(toonString);

  return {
    jsonLength: jsonString.length,
    toonLength: toonString.length,
    jsonTokens,
    toonTokens,
    lengthReduction: 1 - toonString.length / jsonString.length,
    tokenReduction: 1 - toonTokens / jsonTokens,
  };
}

// Re-export library functions for direct use
export { encode, decode } from '@toon-format/toon';
