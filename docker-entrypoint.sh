#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"

echo "Starting Next.js server..."

exec node server.js
