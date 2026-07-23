# Production migration recovery

This recovery is only for the audited production database whose verified legacy
schema prefix is `0000_groovy_black_bolt` through `0002_add_password_reset`.

`db:repair-ledger:final` backs up the database and records only historical
journal entries `0000` through `0037`; it never runs their SQL or modifies
application tables. It logs the full pending range before repair and confirms
that only `0038_production_schema_reconciliation` remains pending afterwards.
Normal startup then runs Drizzle unchanged and logs `0038_execution=applied`
after postflight verification.

Enable the one deployment with all of these environment variables:

```sh
RUN_MIGRATION_LEDGER_FINAL_REPAIR=true
ALLOW_MIGRATION_LEDGER_FINAL_REPAIR=true
EXPECTED_DATABASE_TARGET="host:5432/database?sslmode=require"
EXPECTED_DATABASE_FINGERPRINT="sha256-of-DATABASE_URL"
```

Keep `RUN_MIGRATION_BASELINE=false` and `RUN_MIGRATION_LEDGER_REPAIR=false`.
After the successful deployment, remove both `*_FINAL_REPAIR` flags. A non-empty
ledger is intentionally refused on a later repair attempt.
