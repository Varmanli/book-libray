#!/bin/sh
set -eu

echo "Applying production database migrations..."
MIGRATION_WORKDIR=/app/migration node scripts/run-production-migrations.cjs

echo "Running production database repair..."
node scripts/prod-db-repair.cjs

echo "Starting Next.js server..."

exec "$@"
