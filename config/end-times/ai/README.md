# AI Prompt Templates

This directory holds reviewable, non-secret prompt source for future
End-Times Monitor features. The files are placeholders and are not connected
to runtime code.

Before loading prompts from disk:

1. Define a typed manifest and validate it at startup or build time.
2. Keep trusted instructions separate from untrusted feed content.
3. Preserve the live-context delimiters and injection defenses used by
   `server/worldmonitor/intelligence/v1/chat-analyst-prompt.ts`.
4. Escape or structurally encode source text instead of interpolating it into
   instruction sections.
5. Add tests for missing templates, invalid variables, oversized context,
   line-forgery attempts, and deterministic fallback behavior.
6. Record prompt versions with generated assessments for reproducibility.

Prompt templates must never contain API keys, private source credentials,
personal data, or claims presented as current facts.
