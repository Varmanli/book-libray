#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required at runtime for production database repair." >&2
  exit 1
fi

echo "Running production database repair..."
npm run db:prod:repair

echo "Starting Next.js server..."
exec "$@"
