# Local Runtime Files

This directory is reserved for local, disposable, or operator-managed runtime
artifacts. Its contents are ignored except for this documentation and the
ignore rules.

Suggested subdirectories:

- `logs/`: redirected seeder and maintenance logs.
- `exports/`: local analysis exports and debugging snapshots.
- `redis-backups/`: operator-created Redis backups.

The live Redis database remains in the Compose-managed `redis-data` volume.
Do not bind-mount that volume here by default on Windows/WSL2; named volumes
provide more predictable permissions and filesystem performance. Never place
the only copy of important data in this directory.
