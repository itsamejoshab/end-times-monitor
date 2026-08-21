# End Times Monitor LLM prompts

Catalog of instruction text sent to language models. Use this file to find
what to edit; do not search handler files first.

AI behavior is constrained by [`product-vision.md`](product-vision.md). Prompts
may summarize cited records and draft narrative. They must not originate
facts, define doctrine, compute the convergence level, or treat feed content
as instructions.

## Where to edit

Live dashboard features belong under `server/prompts/` or a dedicated
`*-prompt.ts` module next to the handler. `server/prompts/index.ts` re-exports
those builders.

Background seeders and inherited relays still keep prompt text in the script
that calls the model. Move those into `server/prompts/` only when the script
can import that tree without breaking the Railway worker boundary.

`shared/brief-llm-core.js` and `scripts/shared/brief-llm-core.js` must stay
byte-identical. Change the shared copy and let the mirror test enforce parity.

## Live dashboard features

| Feature | Prompt module | Caller |
|---|---|---|
| News summarization / translation | `server/prompts/summarize-article.ts` (`buildArticlePrompts`) | `server/worldmonitor/news/v1/summarize-article.ts` |
| Country intel brief | `server/prompts/country-intel-brief.ts` | `server/worldmonitor/intelligence/v1/get-country-intel-brief.ts` |
| Event classification | `server/prompts/classify-event.ts` | `server/worldmonitor/intelligence/v1/classify-event.ts` |
| Stock analysis overlay | `server/prompts/analyze-stock.ts` | `server/worldmonitor/market/v1/analyze-stock.ts` |
| Deduction panel | `server/worldmonitor/intelligence/v1/deduction-prompt.ts` | `server/worldmonitor/intelligence/v1/deduct-situation.ts` |
| WM Analyst chat | `server/worldmonitor/intelligence/v1/chat-analyst-prompt.ts` | `api/chat-analyst.ts` |
| Brief “why this matters” (analyst v2) | `shared/brief-llm-core.js` (`WHY_MATTERS_ANALYST_SYSTEM_V2`) plus `server/worldmonitor/intelligence/v1/brief-why-matters-prompt.ts` | `api/internal/brief-why-matters.ts` |

News summarization is re-exported from `server/worldmonitor/news/v1/_shared.ts`
so existing tests keep importing that path.

## Daily brief and digest pipeline

These prompts feed the magazine / digest cron, not the interactive dashboard
RPCs. Several share helpers with the “why this matters” edge endpoint.

| Feature | Prompt location | Caller |
|---|---|---|
| Why this matters (legacy one-sentence) | `shared/brief-llm-core.js` (`WHY_MATTERS_SYSTEM`, `buildWhyMattersUserPrompt`) | `scripts/lib/brief-llm.mjs`, `api/internal/brief-why-matters.ts` |
| Story description sentence | `scripts/lib/brief-llm.mjs` (`STORY_DESCRIPTION_SYSTEM`, `buildStoryDescriptionPrompt`) | same module |
| Digest prose JSON | `scripts/lib/brief-llm.mjs` (`DIGEST_PROSE_SYSTEM_BASE`, `buildDigestPrompt`) | same module |
| World Brief rewrite (single headline) | `scripts/_insights-brief.mjs` (`briefSystemPrompt`) | `scripts/seed-insights.mjs` |
| World Brief top-story synthesis | `scripts/_insights-brief.mjs` (`synthesisSystemPrompt`) | `scripts/seed-insights.mjs` |

## Background seeders

| Feature | Prompt location | Notes |
|---|---|---|
| Regional snapshot narrative | `scripts/regional-snapshot/narrative.mjs` (`buildNarrativePrompt`) | JSON regional brief |
| Weekly regional brief | `scripts/regional-snapshot/weekly-brief.mjs` | weekly intelligence brief |
| Forecast ensemble (outside / inside / adversarial) | `scripts/_forecast-ensemble.mjs` | probability JSON |
| Forecast impact expansion | `scripts/seed-forecasts.mjs` (`buildImpactExpansionSystemPrompt`) | consequence-expansion JSON |
| Critical signal extraction | `scripts/seed-forecasts.mjs` (`CRITICAL_SIGNAL_SYSTEM_PROMPT`) | event frames for simulation |
| Scenario briefs | `scripts/seed-forecasts.mjs` (`SCENARIO_SYSTEM_PROMPT`) | scenario narrative |
| Combined prediction narrative | `scripts/seed-forecasts.mjs` (`COMBINED_SYSTEM_PROMPT`) | per-prediction writeup |
| Impact-prompt critique | `scripts/seed-forecasts.mjs` (`buildImpactPromptCritiqueSystemPrompt`) | meta-prompt that proposes prompt additions |
| Market implications cards | `scripts/seed-forecasts.mjs` (`MARKET_IMPLICATIONS_SYSTEM_PROMPT`) | trade-implication JSON |
| Theater simulation rounds | `scripts/seed-forecasts.mjs` (round 1 and round 2 simulation engines) | actor-behavior simulation |
| Forecast resolution judge | `scripts/seed-forecast-resolutions.mjs` (`buildJudgedResolutionPrompt`) | judges archived forecasts |
| Company monitoring classifier | `scripts/lib/company-monitoring-classification.mjs` (`SYSTEM_PROMPT`) | evidence-only JSON; no admission decision |
| Locale UI translation | `scripts/translate-locales.mjs` | developer tooling, not a dashboard feature |

## Inherited and adjacent surfaces

These are LLM instruction texts that still exist in the tree. They are not
End Times Monitor product prompts unless a later decision keeps the surface.

| Surface | Prompt location |
|---|---|
| AIS news classification (duplicate of dashboard classify) | `scripts/ais-relay.cjs` (`CLASSIFY_SYSTEM_PROMPT`) |
| Widget builder (free) | `scripts/ais-relay.cjs` (`WIDGET_SYSTEM_PROMPT`) |
| Widget builder (Pro) | `scripts/ais-relay.cjs` (`WIDGET_PRO_SYSTEM_PROMPT`) |
| Notification “impact on your portfolio” | `scripts/notification-relay.cjs` (inline `systemPrompt`) |
| MCP workflow templates | `api/mcp/prompts/index.ts` (`PROMPT_REGISTRY`) |

MCP entries are tool-orchestration templates for MCP clients. They are not
system prompts for the dashboard LLM stack.

## User-authored appends

`src/services/analysis-framework-store.ts` stores built-in and imported
`systemPromptAppend` strings. Callers attach them as extra system text on
country briefs, deduction, and related panels. Treat them as untrusted
addenda: sanitize before interpolation, and do not let them override the
trusted product instructions.

## Maintenance

When adding or moving a prompt:

1. Put live-feature instruction text in `server/prompts/` or a dedicated
   `*-prompt.ts` module.
2. Keep the handler responsible for sanitization, caching, and the LLM call.
3. Update this catalog in the same change.
4. Preserve the untrusted-data guardrail: feed titles, bodies, and caller
   text are data, not instructions.
