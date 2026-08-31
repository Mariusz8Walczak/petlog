# PetLog

A single-household, multi-pet health tracker: weight history with automatic
trend alerts, and health events/treatments with a "similar past cases"
suggestion panel. Built with SvelteKit + Drizzle/SQLite; see
`context/foundation/prd.md` for the full product spec.

## Run locally

Requires Node 22 and pnpm 9.

```bash
pnpm install
cp .env.example .env        # edit SEED_EMAIL / SEED_PASSWORD if you like
pnpm run db:migrate          # create the SQLite schema (./data/petlog.db)
pnpm run seed                # create the one household account, from .env
pnpm run dev                 # http://localhost:5173
```

There is no public registration page — `pnpm run seed` is the only way to
create/update the account, by design (see prd.md "Auth").

## Run in Docker

```bash
docker compose up --build
```

Serves the app on **http://localhost:3000** (set `HOST_PORT=3050 docker
compose up` instead if port 3000 is already taken on your machine). The
SQLite file lives at `./data/petlog.db` on the host (mounted into the
container), so data survives `docker compose down`/`up` and restarts.
Migrations run automatically on every container start. To seed the first
account inside the container:

```bash
docker compose exec app node scripts/docker-seed.mjs
```

(`SEED_EMAIL`/`SEED_PASSWORD` come from the root `.env` file, loaded via
`env_file` in `docker-compose.yml`.)

## Tests

```bash
pnpm test                    # Vitest — unit tests for the two domain functions
pnpm exec playwright install # once, to fetch browser binaries
pnpm run test:e2e            # Playwright — weight-trend-alert.spec.ts
```

The e2e run builds the app and boots it with `vite preview`, first running
`db:migrate` + `seed` against the local `.env` DB so the seeded user exists.

On Windows, `pnpm run test:e2e` (`vite build && playwright test`) can fail to
even start Playwright because of the `vite build` exit-code issue described
below — the `&&` never proceeds. Workaround: run `pnpm exec playwright test`
directly (it builds are picked up from the last successful build under
`build/`, or run `pnpm run build` once first and ignore its exit code). This
does not affect Docker or CI (Linux), where `vite build` exits 0 normally.

## What's implemented

Full CRUD on animals, weight logs, health events, and treatments, scoped to
the logged-in user. Two pieces of domain logic drive the actual value:

- **`computeWeightTrend()`** (`src/lib/server/domain/weightTrend.ts`) —
  compares the latest weight entry to the one nearest ~30 days earlier;
  badges the animal page `stable` / `watch` / `alert`.
- **`suggestTreatments()`** (`src/lib/server/domain/treatmentSuggestion.ts`) —
  on the "add health event" form, surfaces past treatments for the _same_
  animal whose symptom text matches, `helped` outcomes ranked first.

## Deviations from context/foundation/tech-stack.md

Documented in detail in `tech-stack.md` itself (search "Uwaga
implementacyjna" / "Uruchamianie w Dockerze"); summary:

- SQLite client: `@libsql/client` (the spec left this open) — chosen for
  prebuilt Linux binaries, simplifying the Docker build.
- `@node-rs/argon2` installed cleanly on both Windows and in the
  `node:22-slim` Docker image; the scrypt fallback mentioned in the brief was
  never needed.
- `@libsql/client` and `drizzle-orm` are `dependencies`, not
  `devDependencies` (the `sv create` drizzle add-on defaults them to dev,
  but `src/lib/server/db/index.ts` imports them at runtime).
- The Docker runtime image doesn't carry `drizzle-kit` (a devDependency);
  container startup instead runs `scripts/docker-migrate.mjs`, which applies
  migrations via `drizzle-orm`'s own runtime migrator.
- Playwright specs live in `e2e/` (outside `src/`) so `*.spec.ts` can be used
  without colliding with Vitest's `src/**` scan.

## Known issue: `pnpm run build` exit code on Windows

On Windows, `vite build` (Vite 8, which bundles via Rolldown by default)
writes a complete, correct `build/` output — then crashes with a native
access-violation _after_ printing its `[PLUGIN_TIMINGS]` diagnostics, so the
process exits non-zero even though the build succeeded. This is a known
upstream Rolldown/Windows issue (see e.g. vitejs/rolldown-vite#584 and
related issues), not specific to this project — confirmed by inspecting
`build/index.js` / `build/handler.js` after the "crash": they're present and
correct. It reproduces even on the latest `vite@8.2.2`. The Docker build
(Linux, `node:22-slim`) is unaffected — that's the path this app actually
ships through. If it blocks a `pnpm run build` you're relying on locally on
Windows, run it inside the Docker build instead, or under WSL.

## Project docs

- `context/foundation/prd.md`, `tech-stack.md`, `roadmap.md`, `test-plan.md`
  — the product/engineering spec this was built from.
- `CLAUDE.md` — guardrails and the two documented AI-assisted workflows for
  this repo (adding a domain entity, running a DB migration).
