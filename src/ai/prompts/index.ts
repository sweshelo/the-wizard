// src/ai/prompts/index.ts

// System prompt
export { SYSTEM_PROMPT, formatGameStateDescription, getSystemPrompt } from './system';

// Mulligan prompt
export {
  MULLIGAN_SYSTEM_PROMPT,
  buildMulliganPrompt,
  type MulliganPromptResponse,
} from './mulligan';

// Action prompt
export { ACTION_SYSTEM_PROMPT, buildActionPrompt, type ActionPromptResponse } from './action';

// Choice prompts
export {
  CHOICE_SYSTEM_PROMPT,
  buildOptionChoicePrompt,
  buildCardChoicePrompt,
  buildUnitChoicePrompt,
  buildBlockChoicePrompt,
  buildInterceptChoicePrompt,
  type ChoicePromptResponse,
} from './choice';
