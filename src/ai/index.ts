// src/ai/index.ts

// 型定義
export type {
  AIGameContext,
  PlayerResources,
  CompactUnit,
  CompactCard,
  AIActionType,
  AIDecision,
  MulliganDecision,
  ChoiceResponse,
  LLMModel,
  AIState,
} from './types';

// 定数
export { AI_CONFIG, MODEL_CONFIG, TIMEOUT_CONFIG, MODEL_COST } from './constants';

// IdMapper
export { IdMapper } from './IdMapper';

// StateTranslator
export { translateGameState, createStateTranslator } from './StateTranslator';
export type { TranslationResult } from './StateTranslator';
