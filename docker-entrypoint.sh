#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required at runtime for db:push." >&2
  exit 1
fi

echo "Running database schema sync..."
npm run db:push

echo "Starting Next.js server..."
exec "$@"
