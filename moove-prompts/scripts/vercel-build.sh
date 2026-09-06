#!/usr/bin/env bash
# Build entrypoint used by vercel.json.
#
# 1. Apply pending Prisma migrations when a real database is configured, so the
#    schema is created/updated automatically on every deploy.
# 2. Run the normal production build (prisma generate + next build).
#
# When DATABASE_URL is unset (or still the placeholder from .env.example), the
# migration step is skipped so a preview build never fails for lack of a DB.
set -euo pipefail

if [[ -n "${DATABASE_URL:-}" && "${DATABASE_URL}" != *"placeholder"* && "${DATABASE_URL}" != *"localhost"* ]]; then
  echo "[vercel-build] DATABASE_URL is set; applying Prisma migrations..."
  npx prisma migrate deploy
else
  echo "[vercel-build] No production DATABASE_URL configured; skipping migrations."
fi

npm run build
