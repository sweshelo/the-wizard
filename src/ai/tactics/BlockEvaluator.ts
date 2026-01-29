// src/ai/tactics/BlockEvaluator.ts
import type { CompactUnit } from '../types';

/**
 * ブロック評価のコンテキスト
 */
export interface BlockContext {
  /** 攻撃してきたユニット */
  attacker: CompactUnit;
  /** ブロッカー候補 */
  blockerCandidates: CompactUnit[];
  /** 自分のライフ */
  myLife: number;
  /** 相手のライフ */
  opponentLife: number;
  /** 自分の手札枚数 */
  myHandCount: number;
  /** 自分のトリガーゾーン枚数 */
  myTriggerCount: number;
}

/**
 * ブロック評価結果
 */
export interface BlockEvaluation {
  /** ブロックすべきか */
  shouldBlock: boolean;
  /** 推奨ブロッカー */
  recommendedBlocker?: CompactUnit;
  /** トレード価値 (-10 to 10) */
  tradeValue: number;
  /** 判断理由 */
  reason: string;
}

/**
 * ランク付けされたブロッカー
 */
export interface RankedBlocker {
  unit: CompactUnit;
  value: number;
  outcome: 'win' | 'trade' | 'lose';
}

/**
 * ブロック評価クラス
 * BP比較、リソース状況を考慮したブロック判断を提供
 */
export class BlockEvaluator {
  /**
   * ブロックの評価
   */
  evaluateBlock(context: BlockContext): BlockEvaluation {
    const { attacker, blockerCandidates, myLife } = context;

    // アクティブなブロッカーのみ抽出
    const activeCandidates = blockerCandidates.filter(u => u.active);

    if (activeCandidates.length === 0) {
      return {
        shouldBlock: false,
        tradeValue: -1,
        reason: 'ブロック可能なユニットがいない',
      };
    }

    // ブロッカーをランク付け
    const rankedBlockers = this.rankBlockers(attacker, activeCandidates);

    // 勝てるブロッカーがいるか
    const winningBlockers = rankedBlockers.filter(b => b.outcome === 'win');
    const tradingBlockers = rankedBlockers.filter(b => b.outcome === 'trade');
    const losingBlockers = rankedBlockers.filter(b => b.outcome === 'lose');

    // ライフ危機的な時は負けてもブロック
    if (myLife === 1) {
      // 勝てるなら勝てるブロッカーで
      if (winningBlockers.length > 0) {
        return {
          shouldBlock: true,
          recommendedBlocker: winningBlockers[0].unit,
          tradeValue: winningBlockers[0].value,
          reason: 'ライフ1で勝てるブロッカーでブロック',
        };
      }
      // 勝てなくてもブロック（最良のブロッカーを選択）
      const bestAvailable = rankedBlockers[0];
      return {
        shouldBlock: true,
        recommendedBlocker: bestAvailable.unit,
        tradeValue: bestAvailable.value,
        reason: 'ライフ1で危機的なため強制ブロック',
      };
    }

    // 勝てるブロッカーがいる場合
    if (winningBlockers.length > 0) {
      // 不屈持ちを優先
      const indomitableBlocker = winningBlockers.find(b => b.unit.abilities.includes('不屈'));
      if (indomitableBlocker) {
        return {
          shouldBlock: true,
          recommendedBlocker: indomitableBlocker.unit,
          tradeValue: indomitableBlocker.value,
          reason: '不屈持ちで有利にブロック',
        };
      }

      // 同じBPで勝てるなら低コストを選ぶ
      const sortedByEfficiency = [...winningBlockers].sort((a, b) => {
        // まずBPが低い方（ギリギリで勝てる方が効率的）
        if (a.unit.bp !== b.unit.bp) {
          return a.unit.bp - b.unit.bp;
        }
        // 同じBPなら低コストを優先
        return a.unit.cost - b.unit.cost;
      });

      return {
        shouldBlock: true,
        recommendedBlocker: sortedByEfficiency[0].unit,
        tradeValue: sortedByEfficiency[0].value,
        reason: '有利にブロック可能',
      };
    }

    // 相打ち可能な場合
    if (tradingBlockers.length > 0) {
      // 不屈持ちなら相打ちでもお得
      const indomitable = tradingBlockers.find(b => b.unit.abilities.includes('不屈'));
      if (indomitable) {
        return {
          shouldBlock: true,
          recommendedBlocker: indomitable.unit,
          tradeValue: 1, // 不屈で実質有利
          reason: '不屈持ちで相打ちトレード',
        };
      }

      // コストが低いユニットで相打ち
      const cheapTrader = tradingBlockers.reduce((best, curr) =>
        curr.unit.cost < best.unit.cost ? curr : best
      );

      // 相手のコストが高いなら相打ち有利
      if (attacker.cost > cheapTrader.unit.cost) {
        return {
          shouldBlock: true,
          recommendedBlocker: cheapTrader.unit,
          tradeValue: 0,
          reason: 'コスト有利な相打ちトレード',
        };
      }

      // ライフに余裕があればスルーも検討
      if (myLife >= 5) {
        return {
          shouldBlock: false,
          tradeValue: 0,
          reason: 'ライフに余裕があるためスルー',
        };
      }

      return {
        shouldBlock: true,
        recommendedBlocker: cheapTrader.unit,
        tradeValue: 0,
        reason: '相打ちトレード',
      };
    }

    // 勝てないブロッカーしかいない
    // 不屈持ちがいれば優先的にブロック（破壊されても復帰するため）
    const losingIndomitable = losingBlockers.find(b => b.unit.abilities.includes('不屈'));
    if (losingIndomitable) {
      return {
        shouldBlock: true,
        recommendedBlocker: losingIndomitable.unit,
        tradeValue: -1,
        reason: '不屈持ちで時間稼ぎ',
      };
    }

    // ライフに余裕があればスルー
    if (myLife >= 4) {
      return {
        shouldBlock: false,
        tradeValue: -2,
        reason: '有利にブロックできないためスルー',
      };
    }

    return {
      shouldBlock: false,
      tradeValue: -3,
      reason: '不利なブロックを回避',
    };
  }

  /**
   * ブロッカーをランク付け
   */
  rankBlockers(attacker: CompactUnit, candidates: CompactUnit[]): RankedBlocker[] {
    const rankings: RankedBlocker[] = [];

    for (const blocker of candidates) {
      if (!blocker.active) continue;

      const value = this.calculateBlockValue(attacker, blocker);
      let outcome: 'win' | 'trade' | 'lose';

      if (blocker.bp > attacker.bp) {
        outcome = 'win';
      } else if (blocker.bp === attacker.bp) {
        outcome = 'trade';
      } else {
        outcome = 'lose';
      }

      rankings.push({ unit: blocker, value, outcome });
    }

    // 勝てる中で最小BP、次に相打ち、最後に負け
    return rankings.sort((a, b) => {
      // まずoutcomeで分類
      const outcomeOrder = { win: 0, trade: 1, lose: 2 };
      if (outcomeOrder[a.outcome] !== outcomeOrder[b.outcome]) {
        return outcomeOrder[a.outcome] - outcomeOrder[b.outcome];
      }

      // 同じoutcomeなら、勝ちの場合は低BPを優先、負けの場合は低コストを優先
      if (a.outcome === 'win') {
        return a.unit.bp - b.unit.bp; // 勝てる最小BP
      } else if (a.outcome === 'lose') {
        return a.unit.cost - b.unit.cost; // 負けるなら低コスト
      }
      return a.unit.cost - b.unit.cost; // 相打ちなら低コスト
    });
  }

  /**
   * ブロック価値を計算
   * @returns -10 to 10 のスコア
   */
  calculateBlockValue(attacker: CompactUnit, blocker: CompactUnit): number {
    const bpDiff = blocker.bp - attacker.bp;

    if (bpDiff > 0) {
      // 勝ち
      return Math.min(5 + Math.floor(bpDiff / 1000), 10);
    } else if (bpDiff < 0) {
      // 負け
      return Math.max(-5 + Math.floor(bpDiff / 1000), -10);
    }

    // 相打ち
    return 0;
  }
}
