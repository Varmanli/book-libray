# Production migration recovery

This recovery is only for the audited production database whose verified legacy
schema prefix is `0000_groovy_black_bolt` through `0002_add_password_reset`.

`db:repair-ledger:final` backs up the database and records only historical
journal entries `0000` through `0037`; it never runs their SQL or modifies
application tables. It logs the full pending range before repair and confirms
that only `0038_production_schema_reconciliation` remains pending afterwards.
Normal startup then runs Drizzle unchanged and logs `0038_execution=applied`
after postflight verification.

Enable exactly one production deployment with this environment variable:

```sh
RUN_ONE_TIME_PRODUCTION_RECOVERY=true
```

Keep `RUN_MIGRATION_BASELINE=false` and `RUN_MIGRATION_LEDGER_REPAIR=false`.
This temporary mode does not require target/fingerprint variables. If a deployment
is interrupted after the ledger write, it resumes only the normal `0038` migration;
if `0038` is already recorded it starts normally without repeating the repair.
After success, remove `RUN_ONE_TIME_PRODUCTION_RECOVERY`.
