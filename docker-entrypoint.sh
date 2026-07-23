#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${DATABASE_BACKUP_DIR:=/app/backups}"
export DATABASE_BACKUP_DIR

if [ "${RUN_MIGRATION_BASELINE:-false}" = "true" ]; then
  echo "Baseline mode detected; creating a pre-baseline backup..."
  node ./scripts/backup-production-db.mjs
  echo "Running guarded one-time migration baseline..."
  node ./scripts/baseline-production-migrations.mjs --if-needed
  echo "Baseline phase completed; continuing with normal guarded migration startup..."
fi

echo "Running guarded migration preflight..."
node ./scripts/run-production-migrations.mjs preflight

echo "Creating pre-migration database backup..."
node ./scripts/backup-production-db.mjs

echo "Applying official Drizzle migrations..."
npm run db:migrate

echo "Running migration postflight verification..."
node ./scripts/run-production-migrations.mjs postflight

echo "Starting Next.js server..."
exec "$@"
