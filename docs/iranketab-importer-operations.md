# IranKetab single-link importer operations

## Workflow and guarantees

The admin enters one IranKetab book URL. The server validates the URL and network destination, extracts and sanitizes the page, analyzes catalog/entity/edition matches, and persists a recoverable import session. Review decisions are autosaved. Covers are prepared under an administrator- and draft-owned temporary key. Final commit revalidates the draft, obtains a PostgreSQL advisory lock for the canonical source, promotes covers, and writes catalog data in one database transaction. Repeated commits use source identities and ISBN constraints to remain idempotent; the advisory lock prevents concurrent duplicate creation.

Sessions and sanitized audit events power recovery and history. A failed autosave does not discard the browser draft. Changing a draft invalidates prepared covers. Transaction failure rolls database changes back; promoted permanent objects are compensated, while retryable prepared temporary media is retained where safe.

## Object-storage lifecycle

- Temporary prefix: `tmp/iranketab-imports/`
- Permanent prefix: `covers/`
- Configure an Arvan bucket lifecycle rule that permanently expires objects with prefix `tmp/iranketab-imports/` after **2 days (48 hours)**. A 24-hour rule is acceptable only if operational retries never need more than one day.
- Do not apply the lifecycle rule to `covers/`.
- Cleanup validates temporary-key ownership and rejects permanent/final keys.
- `BookEdition.coverImage` receives only a server-generated permanent `covers/` key.
- Cleanup failures remain as sanitized history warnings and server logs. No queue, worker, or scheduled application job is required.

Arvan console procedure: open the bucket, create an expiration rule scoped to the exact prefix `tmp/iranketab-imports/`, set expiration to 2 days, verify no rule targets `covers/`, save, and record the rule identifier in deployment records.

## Safe migration procedure

The importer migration is `drizzle/0028_iranketab_import_sessions.sql` and follows journal entry `0027`. Never use `npm run db:push` against an existing environment.

Before staging or production, take a backup and run these read-only checks with the environment's normal `psql` connection:

```sql
select current_database(), current_user;
select id, hash, created_at from drizzle.__drizzle_migrations order by created_at;
select to_regclass('public."IranKetabImportSession"'), to_regclass('public."IranKetabImportEvent"');
select typname from pg_type where typname in ('IranKetabImportStatus', 'IranKetabImportEventType');
```

Classify the environment:

1. No importer tables/types and no importer migration hash: apply pending migrations with `npx drizzle-kit migrate` using an explicitly selected connection.
2. Both importer tables, both enums, all importer indexes, foreign keys, and columns exist but history is missing: do not rerun the SQL. Hash the exact `0028` file, compare the schema column-by-column, and add the matching Drizzle history row only through a reviewed repair change tested on a current-schema clone.
3. Only some objects exist: stop. Diff `pg_catalog` against `0028`, create additive SQL only for missing objects, test it on a clone, and then baseline the migration hash. Never drop or recreate existing objects.

Disposable empty-database validation:

```powershell
docker run --name ghafaseh-import-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=ghafaseh_import -p 55432:5432 -d postgres:16
$env:DATABASE_URL='postgresql://postgres:test@localhost:55432/ghafaseh_import'
npx drizzle-kit migrate
psql $env:DATABASE_URL -c '\d "IranKetabImportSession"'
docker rm -f ghafaseh-import-pg
```

Use a separately named container and port for a restored schema clone. Never point these commands at production.

## Staging verification

Use staging PostgreSQL, a test administrator, and local/staging S3-compatible storage unless staging Arvan access is explicitly authorized. Verify URL validation, extraction, match changes, unresolved entity blocking, edition include/exclude and ISBN conflicts, cover failure/retry, refresh recovery, final validation/commit, history/detail, same-link idempotent reuse, and concurrent requests. Confirm browser console/network logs are clean at mobile, tablet, and desktop widths in both themes.

The remaining Arvan smoke test is: prepare one cover, confirm its temporary key is under the lifecycle prefix, commit it, confirm the edition stores a `covers/` key, and confirm best-effort deletion of the temporary object.

## Production checklist

- Back up PostgreSQL and audit Drizzle history/schema drift.
- Apply reviewed pending migrations with `npx drizzle-kit migrate`; never `db:push`.
- Configure and record the 48-hour temporary-prefix lifecycle rule.
- Verify object-storage credentials and `npm run storage:check`.
- Run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` on the release artifact.
- Run staging single-link E2E and the Arvan smoke test before production traffic.
- Deploy and inspect sanitized history/audit events after the first controlled import.

## Troubleshooting

- `STALE_DRAFT`: validate again, then prepare covers again if requested.
- Cover failure: retain the draft, retry failed/stale covers, and inspect storage access without exposing credentials.
- ISBN/source conflict: review the conflicting edition and choose safe reuse or exclusion.
- Database transaction failure: retry after checking database health; transactional catalog changes were rolled back.
- Autosave failure: keep the page open and restore connectivity. The local draft remains visible.
- Cleanup warning: committed data is valid; verify lifecycle coverage and deletion permissions.
