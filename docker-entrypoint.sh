#!/bin/sh
set -e

echo "[docker-entrypoint] applying database migrations..."
node scripts/docker-migrate.mjs

echo "[docker-entrypoint] starting PetLog..."
exec node build/index.js
