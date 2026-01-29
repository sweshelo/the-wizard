// src/ai/tactics/AttackEvaluator.ts
import type { CompactUnit } from '../types';

/**
 * 攻撃評価のコンテキスト
 */
export interface AttackContext {
  /** 攻撃するユニット */
  attacker: CompactUnit;
  /** 相手のフィールド */
  opponentField: CompactUnit[];
  /** 相手のライフ */
  opponentLife: number;
  /** 相手の手札枚数 */
  opponentHandCount: number;
  /** 相手のトリガーゾーン枚数 */
  opponentTriggerCount: number;
  /** 自分のライフ */
  myLife: number;
}

/**
 * 攻撃評価結果
 */
export interface AttackEvaluation {
  /** 攻撃すべきか */
  shouldAttack: boolean;
  /** 優先度 (0-10) */
  priority: number;
  /** 警戒度 (0-10) */
  caution: number;
  /** 判断理由 */
  reason: string;
}

/**
 * ランク付けされた攻撃者
 */
export interface RankedAttacker {
  unit: CompactUnit;
  evaluation: AttackEvaluation;
}

/**
 * リーサル計算結果
 */
export interface LethalCalculation {
  /** リーサルか */
  isLethal: boolean;
  /** 必要なアタッカー数 */
  attackersNeeded: number;
  /** リーサルパス */
  path: CompactUnit[];
}

/**
 * 攻撃評価クラス
 * BP比較、相手状況を考慮した攻撃判断を提供
 */
export class AttackEvaluator {
  /**
   * 単体攻撃の評価
   */
  evaluateAttack(context: AttackContext): AttackEvaluation {
    const {
      attacker,
      opponentField,
      opponentLife,
      opponentHandCount,
      opponentTriggerCount,
      myLife,
    } = context;

    // 行動済みチェック
    if (!attacker.active) {
      return {
        shouldAttack: false,
        priority: 0,
        caution: 0,
        reason: 'ユニットは行動済み',
      };
    }

    let priority = 5; // 基本優先度
    let caution = 0;
    const reasons: string[] = [];

    // フリーアタック（相手フィールドが空）
    if (opponentField.length === 0) {
      priority += 3;
      reasons.push('フリーアタック可能');

      return {
        shouldAttack: true,
        priority: Math.min(priority, 10),
        caution: 0,
        reason: reasons.join('、'),
      };
    }

    // 相手ライフが低い時は攻撃優先
    if (opponentLife <= 2) {
      priority += 4;
      reasons.push('相手ライフ危機的');
    } else if (opponentLife <= 4) {
      priority += 2;
      reasons.push('相手ライフ低め');
    }

    // BP比較
    const maxOpponentBp = Math.max(...opponentField.map(u => u.bp));
    const bpAdvantage = attacker.bp - maxOpponentBp;

    if (bpAdvantage > 2000) {
      priority += 2;
      reasons.push('BP優位');
    } else if (bpAdvantage > 0) {
      priority += 1;
      reasons.push('BP微優位');
    } else if (bpAdvantage < -2000) {
      priority -= 2;
      caution += 2;
      reasons.push('BP不利');
    }

    // 貫通持ちは優先度UP
    if (attacker.abilities.includes('貫通')) {
      priority += 2;
      reasons.push('貫通ダメージ期待');
    }

    // 手札枚数による警戒
    if (opponentHandCount >= 6) {
      caution += 2;
      reasons.push('相手手札多い');
    } else if (opponentHandCount >= 4) {
      caution += 1;
    }

    // トリガーゾーン警戒
    if (opponentTriggerCount >= 2) {
      caution += 2;
      reasons.push('トリガーゾーン警戒');
    } else if (opponentTriggerCount >= 1) {
      caution += 1;
    }

    // 自分のライフが低い時は慎重に
    if (myLife <= 2) {
      caution += 2;
      reasons.push('自ライフ危機的');
    }

    // 最終判断
    const shouldAttack = priority - caution >= 4;

    return {
      shouldAttack,
      priority: Math.min(Math.max(priority, 0), 10),
      caution: Math.min(Math.max(caution, 0), 10),
      reason: reasons.join('、') || '通常攻撃',
    };
  }

  /**
   * 複数のアタッカーをランク付け
   */
  rankAttackers(
    attackers: CompactUnit[],
    context: Omit<AttackContext, 'attacker'>
  ): RankedAttacker[] {
    const evaluations: RankedAttacker[] = [];

    for (const unit of attackers) {
      if (!unit.active) continue;

      const evaluation = this.evaluateAttack({
        attacker: unit,
        ...context,
      });

      evaluations.push({ unit, evaluation });
    }

    // 優先度順にソート
    return evaluations.sort((a, b) => {
      const scoreA = a.evaluation.priority - a.evaluation.caution;
      const scoreB = b.evaluation.priority - b.evaluation.caution;
      return scoreB - scoreA;
    });
  }

  /**
   * リーサル判定
   */
  calculateLethal(
    myField: CompactUnit[],
    context: {
      opponentField: CompactUnit[];
      opponentLife: number;
      opponentHandCount: number;
      opponentTriggerCount: number;
    }
  ): LethalCalculation {
    const activeAttackers = myField.filter(u => u.active);
    const activeBlockers = context.opponentField.filter(u => u.active);

    // ブロッカーがいる場合は単純なリーサルは困難
    if (activeBlockers.length > 0) {
      // 全てのブロッカーを突破できるか確認
      // BP降順でソートし、上位アタッカーが上位ブロッカーを倒せるかチェック
      const sortedAttackers = [...activeAttackers].sort((a, b) => b.bp - a.bp);
      const sortedBlockers = [...activeBlockers].sort((a, b) => b.bp - a.bp);
      const canPushThrough =
        sortedAttackers.length >= sortedBlockers.length &&
        sortedBlockers.every((blocker, index) => sortedAttackers[index].bp > blocker.bp);

      if (!canPushThrough) {
        return {
          isLethal: false,
          attackersNeeded: 0,
          path: [],
        };
      }

      // ブロッカーを倒した後に何体通るか
      const survivingAttackers = Math.max(0, activeAttackers.length - activeBlockers.length);
      if (survivingAttackers >= context.opponentLife) {
        return {
          isLethal: true,
          attackersNeeded: context.opponentLife + activeBlockers.length,
          path: activeAttackers.slice(0, context.opponentLife + activeBlockers.length),
        };
      }

      return {
        isLethal: false,
        attackersNeeded: 0,
        path: [],
      };
    }

    // ブロッカーなし
    if (activeAttackers.length >= context.opponentLife) {
      return {
        isLethal: true,
        attackersNeeded: context.opponentLife,
        path: activeAttackers.slice(0, context.opponentLife),
      };
    }

    return {
      isLethal: false,
      attackersNeeded: 0,
      path: [],
    };
  }
}
