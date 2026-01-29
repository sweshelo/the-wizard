// src/ai/tactics/InterceptEvaluator.ts
import type { CompactUnit, CompactCard } from '../types';

/**
 * 現在の戦闘状況
 */
export interface BattleState {
  /** 攻撃ユニット */
  attacker: CompactUnit;
  /** 防御ユニット（ダイレクトアタック時はnull） */
  defender: CompactUnit | null;
  /** 自分の攻撃か */
  isMyAttack: boolean;
}

/**
 * ゲームフェーズ
 */
export type GamePhase = 'early' | 'mid' | 'late';

/**
 * インターセプト評価のコンテキスト
 */
export interface InterceptContext {
  /** 発動可能なインターセプト */
  availableIntercepts: CompactCard[];
  /** 現在の戦闘（戦闘中でなければnull） */
  currentBattle: BattleState | null;
  /** 自分のフィールド */
  myField: CompactUnit[];
  /** 相手のフィールド */
  opponentField: CompactUnit[];
  /** 自分のライフ */
  myLife: number;
  /** 相手のライフ */
  opponentLife: number;
  /** 現在のCP */
  currentCp: number;
  /** ゲームフェーズ */
  gamePhase: GamePhase;
}

/**
 * インターセプト評価結果
 */
export interface InterceptEvaluation {
  /** 使用すべきか */
  shouldUse: boolean;
  /** 価値 (-10 to 10) */
  value: number;
  /** 判断理由 */
  reason: string;
}

/**
 * ランク付けされたインターセプト
 */
export interface RankedIntercept {
  intercept: CompactCard;
  evaluation: InterceptEvaluation;
}

/**
 * 温存判断結果
 */
export interface HoldDecision {
  /** 温存すべきか */
  hold: boolean;
  /** 理由 */
  reason: string;
}

/**
 * インターセプト評価クラス
 * インターセプトカードの使用タイミング判断を提供
 */
export class InterceptEvaluator {
  /**
   * インターセプトが発動可能か確認
   */
  canActivate(card: CompactCard, context: InterceptContext): boolean {
    if (card.type !== 'intercept') {
      return false;
    }

    if (!card.playable) {
      return false;
    }

    if (card.cost > context.currentCp) {
      return false;
    }

    return true;
  }

  /**
   * インターセプトの評価
   */
  evaluateIntercept(intercept: CompactCard, context: InterceptContext): InterceptEvaluation {
    // 発動可能でなければ使用不可
    if (!this.canActivate(intercept, context)) {
      return {
        shouldUse: false,
        value: 0,
        reason: 'CPが足りないか、発動条件を満たしていない',
      };
    }

    // 戦闘中でない場合
    if (!context.currentBattle) {
      return {
        shouldUse: false,
        value: 0,
        reason: '戦闘中でないため温存',
      };
    }

    const { currentBattle, myLife } = context;

    // ダイレクトアタックを受けている場合
    if (!currentBattle.defender && !currentBattle.isMyAttack) {
      // ライフが危機的な場合は高価値
      if (myLife <= 2) {
        return {
          shouldUse: true,
          value: 8,
          reason: 'ダイレクトアタックを阻止（ライフ危機）',
        };
      }
      return {
        shouldUse: true,
        value: 5,
        reason: 'ダイレクトアタックを阻止',
      };
    }

    // 戦闘に負けている場合
    if (!currentBattle.isMyAttack && currentBattle.defender) {
      const attackerBp = currentBattle.attacker.bp;
      const defenderBp = currentBattle.defender.bp;

      if (defenderBp < attackerBp) {
        // 負けている戦闘
        const bpGap = attackerBp - defenderBp;

        // インターセプトで逆転できる可能性を評価
        // コストが高いほど効果が強い想定
        const estimatedBoost = intercept.cost * 1000;

        if (estimatedBoost >= bpGap) {
          return {
            shouldUse: true,
            value: 6,
            reason: `戦闘逆転可能（BP差: ${bpGap}）`,
          };
        } else {
          // 完全な逆転はできないが、温存するか判断
          const holdDecision = this.shouldHoldIntercept(intercept, context);
          if (holdDecision.hold) {
            return {
              shouldUse: false,
              value: 2,
              reason: holdDecision.reason,
            };
          }
          return {
            shouldUse: true,
            value: 3,
            reason: 'ダメージ軽減',
          };
        }
      } else {
        // 既に勝っている戦闘
        return {
          shouldUse: false,
          value: 0,
          reason: '既に戦闘に勝っているため温存',
        };
      }
    }

    // 自分の攻撃時
    if (currentBattle.isMyAttack) {
      // 相手のライフが低ければ押し切り
      if (context.opponentLife <= 2) {
        return {
          shouldUse: true,
          value: 7,
          reason: '相手ライフ少ない - 押し切り',
        };
      }

      // それ以外は温存傾向
      const holdDecision = this.shouldHoldIntercept(intercept, context);
      if (holdDecision.hold) {
        return {
          shouldUse: false,
          value: 1,
          reason: holdDecision.reason,
        };
      }
    }

    return {
      shouldUse: false,
      value: 0,
      reason: '温存',
    };
  }

  /**
   * インターセプトをランク付け
   */
  rankIntercepts(intercepts: CompactCard[], context: InterceptContext): RankedIntercept[] {
    const ranked: RankedIntercept[] = [];

    for (const intercept of intercepts) {
      if (!this.canActivate(intercept, context)) {
        continue;
      }

      const evaluation = this.evaluateIntercept(intercept, context);
      ranked.push({ intercept, evaluation });
    }

    // 価値順にソート
    return ranked.sort((a, b) => b.evaluation.value - a.evaluation.value);
  }

  /**
   * インターセプトを温存すべきか判断
   */
  shouldHoldIntercept(intercept: CompactCard, context: InterceptContext): HoldDecision {
    const { gamePhase, myLife, opponentLife } = context;

    // ライフが低い時は温存しない
    if (myLife <= 3) {
      return {
        hold: false,
        reason: 'ライフが低いため使用',
      };
    }

    // 序盤は温存傾向
    if (gamePhase === 'early') {
      return {
        hold: true,
        reason: '序盤は温存',
      };
    }

    // 終盤で有利なら使用
    if (gamePhase === 'late' && myLife > opponentLife) {
      return {
        hold: false,
        reason: '終盤で有利 - 押し切り',
      };
    }

    // 中盤は状況次第
    if (gamePhase === 'mid') {
      // 高コストインターセプトは温存傾向
      if (intercept.cost >= 3) {
        return {
          hold: true,
          reason: '高コストインターセプトを温存',
        };
      }
    }

    return {
      hold: false,
      reason: '使用推奨',
    };
  }

  /**
   * 戦闘への影響を評価
   * @param bpBoost BPブースト量
   * @param context コンテキスト
   * @returns 影響度 (-10 to 10)
   */
  evaluateBattleImpact(bpBoost: number, context: InterceptContext): number {
    const { currentBattle, myLife } = context;

    if (!currentBattle) {
      return 0;
    }

    // ダイレクトアタックを受けている場合
    if (!currentBattle.defender && !currentBattle.isMyAttack) {
      // ライフ1ならダイレクトは致命的
      if (myLife <= 1) {
        return 10;
      }
      return 6;
    }

    // 戦闘中
    if (currentBattle.defender && !currentBattle.isMyAttack) {
      const attackerBp = currentBattle.attacker.bp;
      const defenderBp = currentBattle.defender.bp;
      const newDefenderBp = defenderBp + bpBoost;

      // 逆転できる場合
      if (defenderBp < attackerBp && newDefenderBp >= attackerBp) {
        return 7;
      }

      // 元々勝っている場合
      if (defenderBp >= attackerBp) {
        return 1; // オーバーキル
      }

      // BP差を縮められるが逆転できない
      return 3;
    }

    return 0;
  }
}
