// src/ai/prompts/analysis.ts
import type { AIGameContext } from '../types';

/**
 * ゲームフェーズ
 */
export type GamePhaseName = 'early' | 'mid' | 'late';

/**
 * ゲームフェーズ分析結果
 */
export interface GamePhase {
  name: GamePhaseName;
  description: string;
  advice: string[];
}

/**
 * 盤面アドバンテージ状況
 */
export type BoardAdvantageStatus = 'advantage' | 'parity' | 'disadvantage';

/**
 * 盤面アドバンテージ分析結果
 */
export interface BoardAdvantage {
  status: BoardAdvantageStatus;
  unitDiff: number;
  bpDiff: number;
  description: string;
}

/**
 * リソース分析結果
 */
export interface ResourceAnalysis {
  lifeDiff: number;
  lifeAdvantage: 'leading' | 'tied' | 'trailing';
  handDiff: number;
  warnings: string[];
}

/**
 * ゲームフェーズを分析
 */
export function analyzeGamePhase(context: AIGameContext): GamePhase {
  const { turn } = context;

  if (turn <= 3) {
    return {
      name: 'early',
      description: '序盤戦：基盤構築フェーズ',
      advice: [
        '低コストユニットで盤面を構築する',
        'リソースを温存しつつ展開する',
        '相手のデッキタイプを見極める',
        'CPを効率的に使用する',
      ],
    };
  }

  if (turn <= 7) {
    return {
      name: 'mid',
      description: '中盤戦：主力展開フェーズ',
      advice: [
        '主力ユニットを展開する',
        'トリガーゾーンを活用する',
        '相手のキーカードに注意する',
        'ライフ差を意識した攻防を行う',
      ],
    };
  }

  return {
    name: 'late',
    description: '終盤戦：決着フェーズ',
    advice: [
      'リーサルを意識する',
      '残りリソースで最大効果を狙う',
      '相手のジョーカーに警戒する',
      '確実に勝てるなら押し切る',
    ],
  };
}

/**
 * 盤面アドバンテージを分析
 */
export function analyzeBoardAdvantage(context: AIGameContext): BoardAdvantage {
  const myUnits = context.myField.length;
  const oppUnits = context.opponentField.length;
  const unitDiff = myUnits - oppUnits;

  const myTotalBp = context.myField.reduce((sum, u) => sum + u.bp, 0);
  const oppTotalBp = context.opponentField.reduce((sum, u) => sum + u.bp, 0);
  const bpDiff = myTotalBp - oppTotalBp;

  let status: BoardAdvantageStatus;
  let description: string;

  if (unitDiff > 0 || bpDiff > 2000) {
    status = 'advantage';
    description = `盤面有利（ユニット差: +${unitDiff}, BP差: +${bpDiff}）`;
  } else if (unitDiff < 0 || bpDiff < -2000) {
    status = 'disadvantage';
    description = `盤面不利（ユニット差: ${unitDiff}, BP差: ${bpDiff}）`;
  } else {
    status = 'parity';
    description = '盤面互角';
  }

  return { status, unitDiff, bpDiff, description };
}

/**
 * リソース状況を分析
 */
export function analyzeResourceSituation(context: AIGameContext): ResourceAnalysis {
  const lifeDiff = context.self.life - context.opponent.life;
  const handDiff = context.self.handCount - context.opponent.handCount;

  let lifeAdvantage: 'leading' | 'tied' | 'trailing';
  if (lifeDiff > 0) {
    lifeAdvantage = 'leading';
  } else if (lifeDiff < 0) {
    lifeAdvantage = 'trailing';
  } else {
    lifeAdvantage = 'tied';
  }

  const warnings: string[] = [];

  if (context.self.handCount <= 2) {
    warnings.push('手札が少ない');
  }

  if (context.self.life <= 3) {
    warnings.push('ライフが危険');
  }

  if (context.self.deckCount <= 5) {
    warnings.push('デッキ切れが近い');
  }

  return {
    lifeDiff,
    lifeAdvantage,
    handDiff,
    warnings,
  };
}

/**
 * 状況に応じたアドバイスを生成
 */
export function generateSituationalAdvice(context: AIGameContext): string[] {
  const advice: string[] = [];
  const phase = analyzeGamePhase(context);
  const board = analyzeBoardAdvantage(context);
  const resources = analyzeResourceSituation(context);

  // フェーズ別アドバイス
  advice.push(...phase.advice.slice(0, 2));

  // 盤面状況に応じたアドバイス
  if (board.status === 'advantage') {
    advice.push('盤面有利を活かして攻撃的にプレイする');
    if (resources.lifeAdvantage === 'leading' && context.opponent.life <= 3) {
      advice.push('相手ライフが少ない - 押し切りを狙う');
    }
  } else if (board.status === 'disadvantage') {
    advice.push('防御的なプレイで盤面を立て直す');
    if (context.self.life <= 3) {
      advice.push('ライフ危険 - 守りを優先する');
    }
  }

  // リソース警告
  for (const warning of resources.warnings) {
    if (warning === '手札が少ない') {
      advice.push('手札補充を優先する');
    } else if (warning === 'ライフが危険') {
      advice.push('ライフを守ることを最優先に');
    }
  }

  // ライフリードしている場合
  if (resources.lifeAdvantage === 'leading' && resources.lifeDiff >= 4) {
    advice.push('ライフリードを活かしてトレードを仕掛ける');
  }

  return advice;
}

/**
 * 完全な分析をフォーマット
 */
export function formatAnalysis(context: AIGameContext): string {
  const phase = analyzeGamePhase(context);
  const board = analyzeBoardAdvantage(context);
  const resources = analyzeResourceSituation(context);
  const advice = generateSituationalAdvice(context);

  const sections: string[] = [];

  // ゲームフェーズ
  sections.push(`## ゲームフェーズ`);
  sections.push(`**${phase.description}** (ターン ${context.turn})`);

  // 盤面状況
  sections.push(`\n## 盤面状況`);
  sections.push(board.description);
  sections.push(`- 自分のユニット: ${context.myField.length}体`);
  sections.push(`- 相手のユニット: ${context.opponentField.length}体`);

  // リソース状況
  sections.push(`\n## リソース状況`);
  sections.push(
    `- ライフ: ${context.self.life} vs ${context.opponent.life} (差: ${resources.lifeDiff >= 0 ? '+' : ''}${resources.lifeDiff})`
  );
  sections.push(`- 手札: ${context.self.handCount}枚 vs ${context.opponent.handCount}枚`);
  sections.push(`- CP: ${context.self.cp.current}/${context.self.cp.max}`);

  if (resources.warnings.length > 0) {
    sections.push(`\n**警告:** ${resources.warnings.join(', ')}`);
  }

  // アドバイス
  sections.push(`\n## アドバイス`);
  for (const item of advice) {
    sections.push(`- ${item}`);
  }

  return sections.join('\n');
}
