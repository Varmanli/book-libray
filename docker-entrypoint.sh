#!/bin/sh
set -eu

echo "Running production database repair..."
node scripts/prod-db-repair.mjs

echo "Starting Next.js server..."
exec "$@"
