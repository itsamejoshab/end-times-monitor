// ========================================================================
// Constants
// ========================================================================

export const CACHE_TTL_SECONDS = 86400; // 24 hours

// ========================================================================
// Shared cache-key logic (used by both server handler and client GET lookup)
// ========================================================================

export {
  CACHE_VERSION,
  canonicalizeSummaryInputs,
  buildSummaryCacheKey,
  buildSummaryCacheKey as getCacheKey,
  selectUniqueHeadlinePairs,
} from '../../../../src/utils/summary-cache-key';

// ========================================================================
// Hash utility (unified FNV-1a 52-bit -- H-7 fix)
// ========================================================================

import { hashString } from '../../../_shared/hash';
export { hashString };

// ========================================================================
// Headline deduplication (used by SummarizeArticle)
// ========================================================================

export { deduplicateHeadlines } from './dedup.mjs';

// ========================================================================
// SummarizeArticle: Full prompt builder (ported from _summarize-handler.js)
// ========================================================================

export { buildArticlePrompts } from '../../../prompts/summarize-article';

// ========================================================================
// SummarizeArticle: Provider credential resolution (canonical source)
// ========================================================================

export { getProviderCredentials } from '../../../_shared/llm';
export type { ProviderCredentials } from '../../../_shared/llm';
