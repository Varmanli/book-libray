#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${DATABASE_BACKUP_DIR:=/app/backups}"
export DATABASE_BACKUP_DIR

if [ "${RUN_MIGRATION_BASELINE:-false}" = "true" ]; then
  echo "Running one-time migration baseline maintenance mode..."
  node ./scripts/backup-production-db.mjs
  node ./scripts/baseline-production-migrations.mjs
  exit 0
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
