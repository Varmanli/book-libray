#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${DATABASE_BACKUP_DIR:=/app/backups}"
export DATABASE_BACKUP_DIR

if [ "${RUN_MIGRATION_BASELINE:-false}" = "true" ]; then
  echo "Checking persistent baseline failure marker..."
  node ./scripts/migration-baseline-attempt-guard.mjs preflight
  echo "Baseline mode detected; creating a pre-baseline backup..."
  node ./scripts/backup-production-db.mjs
  echo "Running guarded one-time migration baseline..."
  if ! node ./scripts/baseline-production-migrations.mjs --if-needed; then
    node ./scripts/migration-baseline-attempt-guard.mjs record
    exit 1
  fi
  echo "Baseline phase completed; continuing with normal guarded migration startup..."
fi

if [ "${RUN_MIGRATION_AUDIT_ONCE:-false}" = "true" ]; then
  audit_dir="$DATABASE_BACKUP_DIR/migration-audits"
  audit_file="$audit_dir/migration-audit-$(date -u +%Y%m%dT%H%M%SZ).json"
  audit_log_summary=""
  if [ "${RUN_MIGRATION_AUDIT_LOG_SUMMARY:-false}" = "true" ]; then
    audit_log_summary="--log-summary"
    echo "Migration audit log summary enabled"
  fi
  echo "Migration audit enabled"
  echo "Running read-only migration audit..."
  if mkdir -p "$audit_dir" && node ./scripts/audit-production-migration-baseline.mjs "--output=$audit_file" $audit_log_summary; then
    echo "Audit report saved: $audit_file"
    echo "Migration audit completed"
  else
    echo "WARNING: migration audit failed; continuing to guarded migration preflight."
  fi
fi

if [ "${RUN_MIGRATION_LEDGER_REPAIR:-false}" = "true" ]; then
  echo "Checking persistent ledger-repair failure marker..."
  node ./scripts/migration-baseline-attempt-guard.mjs preflight ledger-repair
  echo "Migration ledger repair enabled; creating guarded backup and repairing Drizzle ledger only..."
  if ! node ./scripts/repair-production-migration-ledger.mjs; then
    node ./scripts/migration-baseline-attempt-guard.mjs record ledger-repair
    exit 1
  fi
  echo "Migration ledger repair completed; continuing to guarded migration preflight..."
fi

if [ "${RUN_ONE_TIME_PRODUCTION_RECOVERY:-false}" = "true" ]; then
  echo "One-time production recovery enabled; this is not used on normal startup."
  echo "Recovery will back up first when the ledger is empty, then record only 0000 through 0037."
  if ! node ./scripts/repair-final-production-migration-ledger.mjs; then
    echo "One-time production recovery failed; no historical SQL was run. Remove the flag only after resolving the failure."
    exit 1
  fi
  echo "One-time production recovery ledger phase succeeded; normal Drizzle migration will now apply 0038 if pending."
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
