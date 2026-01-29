// src/ai/tactics/index.ts

export { AttackEvaluator } from './AttackEvaluator';
export type {
  AttackContext,
  AttackEvaluation,
  RankedAttacker,
  LethalCalculation,
} from './AttackEvaluator';

export { BlockEvaluator } from './BlockEvaluator';
export type { BlockContext, BlockEvaluation, RankedBlocker } from './BlockEvaluator';

export { InterceptEvaluator } from './InterceptEvaluator';
export type {
  BattleState,
  GamePhase as InterceptGamePhase,
  InterceptContext,
  InterceptEvaluation,
  RankedIntercept,
  HoldDecision,
} from './InterceptEvaluator';
