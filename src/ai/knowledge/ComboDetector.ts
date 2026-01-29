// src/ai/knowledge/ComboDetector.ts

/**
 * プレイイベントのタイプ
 */
export type PlayEventType = 'summon' | 'effect' | 'attack' | 'block' | 'trigger' | 'intercept';

/**
 * プレイイベント
 */
export interface PlayEvent {
  cardId: string;
  cardName: string;
  turn: number;
  timestamp: Date;
  type: PlayEventType;
  targetId?: string;
  targetName?: string;
}

/**
 * プレイシーケンス
 */
export interface PlaySequence {
  turn: number;
  events: PlayEvent[];
  duration: number; // ミリ秒
}

/**
 * コンボパターン
 */
export interface ComboPattern {
  cardNames: string[];
  occurrences: number;
  turns: number[];
  isThreat: boolean;
}

/**
 * コンボ検出クラス
 * 相手のプレイパターンからコンボを検出する
 */
export class ComboDetector {
  private playHistory: PlayEvent[] = [];
  private static readonly MIN_SEQUENCE_LENGTH = 2;
  private static readonly MIN_PATTERN_OCCURRENCES = 2;

  /**
   * プレイを記録
   */
  recordPlay(event: PlayEvent): void {
    this.playHistory.push(event);
  }

  /**
   * プレイ履歴を取得
   */
  getPlayHistory(): PlayEvent[] {
    return [...this.playHistory];
  }

  /**
   * 連続プレイシーケンスを検出
   */
  detectSequences(_currentTurn: number): PlaySequence[] {
    const sequences: PlaySequence[] = [];

    // ターンごとにグループ化
    const playsByTurn = new Map<number, PlayEvent[]>();
    for (const play of this.playHistory) {
      if (!playsByTurn.has(play.turn)) {
        playsByTurn.set(play.turn, []);
      }
      const turnPlays = playsByTurn.get(play.turn);
      if (turnPlays) {
        turnPlays.push(play);
      }
    }

    // 各ターンのシーケンスを抽出
    for (const [turn, plays] of playsByTurn) {
      if (plays.length >= ComboDetector.MIN_SEQUENCE_LENGTH) {
        // タイムスタンプでソート
        const sorted = [...plays].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const duration =
          sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime();

        sequences.push({
          turn,
          events: sorted,
          duration,
        });
      }
    }

    return sequences;
  }

  /**
   * コンボパターンを検出
   */
  detectComboPatterns(): ComboPattern[] {
    const sequences = this.detectSequences(0);
    const patternMap = new Map<string, { cardNames: string[]; turns: number[] }>();

    for (const seq of sequences) {
      // シーケンス内のカード名の組み合わせをキーとして使用
      const cardNames = seq.events.map(e => e.cardName);
      const key = cardNames.join('|');

      if (!patternMap.has(key)) {
        patternMap.set(key, { cardNames, turns: [] });
      }
      const pattern = patternMap.get(key);
      if (pattern) {
        pattern.turns.push(seq.turn);
      }
    }

    const patterns: ComboPattern[] = [];
    for (const [_, pattern] of patternMap) {
      if (pattern.turns.length >= ComboDetector.MIN_PATTERN_OCCURRENCES) {
        patterns.push({
          cardNames: pattern.cardNames,
          occurrences: pattern.turns.length,
          turns: pattern.turns,
          isThreat: pattern.turns.length >= 3, // 3回以上は脅威と判定
        });
      }
    }

    // 出現回数でソート
    patterns.sort((a, b) => b.occurrences - a.occurrences);

    return patterns;
  }

  /**
   * 警告を生成
   */
  getWarnings(): string[] {
    const patterns = this.detectComboPatterns();
    const warnings: string[] = [];

    for (const pattern of patterns) {
      const cardList = pattern.cardNames.join(' → ');
      if (pattern.isThreat) {
        warnings.push(`⚠️ 頻出コンボ検出: ${cardList} (${pattern.occurrences}回出現)`);
      } else {
        warnings.push(`コンボ検出: ${cardList} (${pattern.occurrences}回出現)`);
      }
    }

    return warnings;
  }

  /**
   * クリア
   */
  clear(): void {
    this.playHistory = [];
  }

  /**
   * 最近のプレイを取得
   */
  getRecentPlays(currentTurn: number, turnsBack: number): PlayEvent[] {
    const minTurn = currentTurn - turnsBack + 1;
    return this.playHistory.filter(p => p.turn >= minTurn);
  }

  /**
   * 特定カードの出現回数を取得
   */
  getCardPlayCount(cardName: string): number {
    return this.playHistory.filter(p => p.cardName === cardName).length;
  }

  /**
   * よく使われるカードを取得
   */
  getFrequentCards(limit: number = 5): Array<{ cardName: string; count: number }> {
    const counts = new Map<string, number>();

    for (const play of this.playHistory) {
      counts.set(play.cardName, (counts.get(play.cardName) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([cardName, count]) => ({ cardName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
