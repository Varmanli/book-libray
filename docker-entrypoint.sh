#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"

echo "Running production database repair..."
node ./scripts/prod-db-repair.mjs

echo "Starting Next.js server..."
exec "$@"
