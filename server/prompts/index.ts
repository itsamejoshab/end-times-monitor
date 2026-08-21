/**
 * LLM prompt catalog for live dashboard features.
 *
 * Full inventory, including seeders still outside this folder:
 *   docs/end-times/prompts.md
 *
 * Handlers should import from here or from the dedicated file; do not
 * re-embed system prompt text in RPCs.
 */

export { CLASSIFY_EVENT_SYSTEM_PROMPT } from './classify-event';
export { buildCountryIntelBriefSystemPrompt } from './country-intel-brief';
export { ANALYZE_STOCK_SYSTEM_PROMPT } from './analyze-stock';
export { buildArticlePrompts } from './summarize-article';

export {
  buildDeductionPrompt,
  inferDeductionMode,
  postProcessDeductionOutput,
} from '../worldmonitor/intelligence/v1/deduction-prompt';
export { buildAnalystSystemPrompt } from '../worldmonitor/intelligence/v1/chat-analyst-prompt';
export { buildAnalystWhyMattersPrompt } from '../worldmonitor/intelligence/v1/brief-why-matters-prompt';
