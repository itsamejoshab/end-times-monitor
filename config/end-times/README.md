# End-Times Configuration

This directory is the versioned configuration boundary for the End-Times
Monitor fork. Files here describe editorial policy and source classification;
they must not contain credentials, fetched records, generated output, or
runtime state.

## Intended contents

- `taxonomy.example.yaml`: starter event categories and severity guidance.
- `sources.example.yaml`: starter source metadata and filtering policy.
- `ai/`: human-reviewable prompt templates and prompt-authoring guidance.

The example files are placeholders and are not loaded by the application yet.
When runtime loading is added, introduce a typed schema, fail-fast validation,
focused tests, and explicit defaults before removing the `.example` suffix.

## Existing repository boundaries

- Application registries remain in `src/config/`.
- Proto contracts remain in `proto/`; generated clients must not be edited.
- Executable ingestion and transformation code remains in `scripts/`.
- Tracked reference datasets remain in `data/` and `scripts/data/`.
- Browser-facing generated output remains in `public/`.
- Live cache and seeded records remain in Redis.
- Local logs, exports, and backups belong in `var/`.

## Secrets

Never place secrets in this directory. Use the ignored `.env`,
`docker-compose.override.yml`, or `secrets/` paths described in
`SELF_HOSTING.md`. Variables prefixed with `VITE_` are exposed to browser code
and must not contain server credentials.
