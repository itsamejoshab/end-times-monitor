# End-Times Monitor Local Development

This checkout tracks the `main` branch of
`itsamejoshab/end-times-monitor`. The `upstream` remote points to
`koala73/worldmonitor` so upstream changes can be reviewed and merged
deliberately.

The initial milestone preserves World Monitor behavior. Configuration under
`config/end-times/` is documentation and placeholder policy only until a
validated runtime loader is implemented.

## Prerequisites

- Git with SSH access to the fork.
- Docker Desktop with the WSL2 engine and WSL integration enabled.
- A WSL2 distribution with Bash and OpenSSL.
- GNU Make installed in WSL (`sudo apt-get install make`).
- Node.js 24, matching `.nvmrc`.

On AMD systems, UEFI/BIOS virtualization is commonly labeled `SVM Mode`.
Docker cannot start until firmware virtualization and the Windows Virtual
Machine Platform feature are both enabled. `systeminfo` should report
`Virtualization Enabled In Firmware: Yes`.

The checkout is available to WSL at:

```text
/mnt/c/Users/untru/dev/end-times-monitor
```

Running dependency installation from a Windows-mounted path can be slower
than using the native WSL filesystem. Keep the checkout in its current
location for Cursor access unless installation performance becomes a
measurable problem.

## Remotes

```bash
git remote -v
git status --short --branch
git fetch upstream main
```

`origin` is the writable fork. `upstream` is read-only project history for
future synchronization. Do not push directly to `upstream`.

## Local secrets

The Compose stack requires four generated values. Create an ignored `.env`
from `.env.example`, then set:

```dotenv
RELAY_SHARED_SECRET=<random 32-byte hexadecimal value>
REDIS_PASSWORD=<different random 32-byte hexadecimal value>
REDIS_TOKEN=<different random 32-byte hexadecimal value>
WM_SESSION_SECRET=<different random 32-byte hexadecimal value>
```

Generate each value independently with `openssl rand -hex 32`. Optional
provider keys belong in the ignored `docker-compose.override.yml` or
`secrets/` directory. Never put server secrets in `VITE_` variables because
Vite exposes those values to browser code.

## Install and start

From WSL2:

```bash
cd /mnt/c/Users/untru/dev/end-times-monitor
npm install
docker compose config --quiet
make up
make health
```

Open `http://localhost:3000`. Most public feeds work without optional
credentials; provider-specific features degrade gracefully.

For the normal rebuild, restart, log, and seeding workflow after installation,
see `local-operations.md`.

Inspect the stack with:

```bash
make status
make logs
curl --fail http://localhost:3000/api/sidecar-health
```

Use `docker compose down` to stop containers while retaining Redis data.
`docker compose down -v` also deletes the Redis volume and should be used only
when intentionally resetting local seeded state.

## Project boundaries

- `config/end-times/`: tracked editorial taxonomy, source policy, and prompt
  templates; no secrets or runtime data.
- `src/config/`: application-owned TypeScript registries.
- `scripts/`: executable ingestion, filtering, generation, and seeding code.
- `proto/`: API contracts; regenerate clients rather than editing generated
  files.
- `data/` and `scripts/data/`: existing tracked reference data conventions.
- `public/`: browser-facing static and generated artifacts.
- Redis: live seeded/cache state in the Compose named volume.
- `var/`: ignored local logs, exports, and backups.

Future end-times features should extend the closest existing subsystem rather
than creating parallel Docker, Proto, Redis, GDELT, or script stacks.

## Docker reports no virtualization

On the current ASUS/AMD workstation:

1. Restart into UEFI/BIOS setup with `Del` or `F2`.
2. Open Advanced Mode (`F7`), then locate CPU configuration.
3. Enable `SVM Mode`, save with `F10`, and boot Windows.
4. From an elevated PowerShell window, run `wsl --install -d Ubuntu`.
5. Restart Windows when requested, complete Ubuntu's first-run setup, and
   launch Docker Desktop again.

The exact UEFI menu name can vary by ASUS motherboard firmware. Do not enable
or change unrelated overclocking, secure-boot, or memory settings.
