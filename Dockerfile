# syntax=docker/dockerfile:1

FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable

# ---- deps + build ----
FROM base AS build
COPY package.json pnpm-lock.yaml .npmrc ./
# Full install (incl. devDependencies) — needed to run `vite build`.
RUN pnpm install --frozen-lockfile
COPY . .
# SvelteKit's build-time route analysis imports src/lib/server/db/index.ts,
# which throws without DATABASE_URL — this placeholder value is only used
# during that static analysis step, never for a real connection at runtime
# (the real value is injected via docker-compose.yml at container start).
ENV DATABASE_URL=file:./data/build-placeholder.db
RUN pnpm run build

# ---- slim runtime ----
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml .npmrc ./
# Prod-only install: no vite/svelte-check/eslint/playwright/drizzle-kit etc.
RUN pnpm install --prod --frozen-lockfile

# adapter-node build output
COPY --from=build /app/build ./build
# SQL migration files + the two plain-JS runtime scripts (migrate/seed run
# against only prod deps — see their file headers for why they don't import
# drizzle-kit/tsx/dotenv, which are devDependencies excluded from this stage).
COPY --from=build /app/drizzle ./drizzle
COPY scripts/docker-migrate.mjs scripts/docker-seed.mjs ./scripts/
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
