#!/bin/sh
set -eu

echo "Running prestart production tasks..."
npm run prestart:prod

echo "Starting Next.js server..."
exec "$@"
