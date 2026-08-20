# Local Operations Runbook

Run these commands from WSL2 in:

```text
/mnt/c/Users/untru/dev/end-times-monitor
```

The root `Makefile` wraps the existing Docker Compose stack. Run `make help`
to list both local operations and the upstream Proto development targets.

## Normal change cycle

After changing application, API, Docker, or configuration files:

```bash
make up
make status
make health
```

`make up` runs `docker compose up -d --build`. Docker rebuilds invalidated
image layers, recreates affected containers, and leaves Redis data intact.
Open `http://localhost:3000` after the health check passes.

For a quick status or log check:

```bash
make status
make logs
```

Use `make logs-follow` to stream logs until interrupted with `Ctrl+C`.

## Stop and restart

Stop the stack without deleting Redis:

```bash
make down
```

Start it again and adopt current source changes:

```bash
make up
```

Running `make up` directly while the stack is active is also safe. Compose
rebuilds and recreates only what changed.

## Seed data

The application and API do not require a complete seed run to start. Seeders
fetch external datasets, normalize them, and store results in local Redis.
They do not build frontend components.

```bash
make seed
```

Standalone seeders are capped at 30 seconds for local development. Increase
the cap for slow providers when needed:

```bash
make seed SEED_TIMEOUT=180
```

Missing credentials, upstream outages, rate limits, and unavailable optional
feeds can produce skips or failures while the dashboard remains usable. Check
`SELF_HOSTING.md` before adding optional provider credentials.

## Reset local data

Use this only when intentionally discarding all locally seeded Redis data:

```bash
make reset-data
```

The target requires typing `reset` before it runs `docker compose down
--volumes`. A normal `make down` preserves the volume.

## Before committing

At minimum:

```bash
make up
make health
git diff --check
git status --short
```

Then run the smallest focused tests for the changed surface. Browser changes
normally require `npm run typecheck` and `npm run lint:boundaries`; API or
server changes normally require `npm run typecheck:api`. See `AGENTS.md` for
the repository-wide verification contract.

Never commit `.env`, `docker-compose.override.yml`, `secrets/`, or anything
under `var/` other than its tracked README and ignore rules.

## Troubleshooting

- `make health` fails while containers are starting: wait a few seconds, run
  `make status`, then inspect `make logs`.
- Port 3000 is already in use: stop the other process or change `WM_PORT` in
  the ignored `.env`.
- Docker reports no virtualization: follow the firmware and WSL instructions
  in `local-development.md`.
- A Docker shell entrypoint is reported missing on Windows: verify Git applied
  the repository's `*.sh text eol=lf` rule, then rebuild with `make up`.
