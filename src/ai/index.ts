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

// AIController
export { AIController, createAIController } from './AIController';
export type {
  AIControllerConfig,
  AIEventType,
  AIEvent,
  AIResponseCallback,
  AIControllerResponse,
} from './AIController';

// Heuristics
export { Heuristics, createHeuristics, defaultHeuristics } from './Heuristics';
export type { HeuristicsConfig } from './Heuristics';
export { DEFAULT_HEURISTICS_CONFIG } from './Heuristics';

// LLMClient
export { LLMClient, createLLMClient, LLMError } from './LLMClient';
export type { LLMClientConfig, LLMRequestOptions, LLMResponse } from './LLMClient';

// ComplexityEvaluator
export {
  ComplexityEvaluator,
  createComplexityEvaluator,
  defaultComplexityEvaluator,
} from './ComplexityEvaluator';
export type { ComplexityEvaluation, ComplexityEvaluatorConfig } from './ComplexityEvaluator';
export { DEFAULT_COMPLEXITY_CONFIG } from './ComplexityEvaluator';

// Prompts
export * from './prompts';

// Chat
export * from './chat';

// Catalog
export * from './catalog';

// Tactics
export * from './tactics';

// PreGameAnalyzer
export { PreGameAnalyzer } from './PreGameAnalyzer';
export type {
  DeckCard,
  DeckComposition,
  KeyCard,
  DeckStrategy,
  PreGameAnalysis,
} from './PreGameAnalyzer';

// Thread
export * from './thread';
