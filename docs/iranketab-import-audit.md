# IranKetab importer audit — 2026-07-18

## Scope and evidence

This audit traces the live admin import path. It is based on the route, UI, extractor, persistence, storage, and test code in this repository. No production database, object storage, or IranKetab traffic was available, so operation counts below are static upper-bound estimates; they are not claimed measurements.

The exact English message “Link could not be identified” is not present in this repository. The closest emitted failures are `DNS_FAILED` (`lib/importers/iranketab/secure-fetch.ts`, “IranKetab address could not be resolved”), `UNSUPPORTED_*`, `REDIRECT_REJECTED`, `PAGE_STRUCTURE_UNRECOGNIZED`, and the client’s generic network error. Conflating those messages outside this codebase (for example, a proxy/UI translation) must be checked separately.

## A. Current architecture and execution map

```mermaid
sequenceDiagram
  participant A as Admin browser
  participant P as POST preview
  participant I as IranKetab
  participant D as PostgreSQL
  participant S as Object storage
  A->>P: URL
  P->>D: create session + event + status transition
  P->>I: one secured book-page fetch (0–3 redirects)
  P->>I: contributor profile fetches (up to 3 concurrent)
  P->>D: 4–9 batched match queries
  P->>D: persist extraction, analysis and preview
  A->>D: draft autosave (debounced, each edit burst)
  A->>P: validate draft; prepare covers
  P->>I: one cover fetch per unique selected URL
  P->>S: temporary WebP upload per selected edition
  A->>P: commit
  P->>S: Head/copy temporary media to final keys
  P->>D: transactional catalog, editions, references and relations
```

Frontend calls: initial page load makes `sessions/active` and `import-history`; submitting makes `preview`; editing autosaves `sessions/:id/draft`; then `validate-draft`, `prepare-covers`, and `commit`. The user must explicitly review and confirm; this is a deliberate staged-admin workflow, not an automatic one-click importer.

`preview-handler.ts` validates the URL, creates a session, obtains one HTML document using `secure-fetch.ts`, parses it once through `extractIranKetabBook`, enriches contributor profiles, runs matching, and persists the full extraction/analysis/preview JSON. `match-repository.ts` uses four parallel query groups and may issue a fifth catalog query. `cover-preparation.ts` downloads, decodes, transforms, and stores selected media. `commit.ts` takes a PostgreSQL advisory lock derived from the numeric book ID, validates staged media, copies it to final storage, then writes catalog data in one transaction.

## B. Confirmed bottlenecks

| Severity | Location | Confirmed evidence and impact | Safe fix |
|---|---|---|---|
| High | `reference-profile.ts: enrichIranKetabReferenceProfiles` | Preview fetched every unique author/translator/publisher profile, formerly with two attempts each. A 50-edition book can contain many unique translators/publishers; latency grows in batches of three and failures doubled requests. | Implemented: one attempt by default, still bounded at three concurrent requests. Make profile hydration opt-in/lazy in a later refactor. |
| High | `cover-preparation.ts: prepareIranKetabCovers` | Covers were downloaded and Sharp-transformed sequentially, once per selected edition. Shared image URLs repeated network and CPU work. | Implemented: 1–6 configurable bounded workers (default 3) and request-scoped processed-image cache keyed by URL; each edition still gets its own ownership-bound staged object. |
| Medium | `secure-fetch.ts` and extractor `validate-url.ts` | Query parameters survived canonicalization, making the same book appear as distinct session/source URLs. The commit lock eventually deduplicated writes, but preview and sessions could duplicate work. | Implemented: remove query and fragment in both normalizers. |
| Medium | `session.ts: createImportSession/transitionImportSession/appendImportEvent` and `prepare-covers/route.ts` | One preview creates at least three session writes/events; cover preparation adds status writes plus an event per contributor/image. These are audit-heavy and scale with entities. | Keep only stage-level events; remove synthetic contributor events in the structural refactor. Never alter enum values at request time. |
| Medium | `commit.ts: 621+`, `800+` | Edition and contributor relations are written in sequential loops inside one transaction. This protects integrity but makes DB round trips scale with editions/translators. | Load existing relations once and use multi-row inserts/upserts per relation type. |
| Medium | `commit/route.ts: reprepareMissingIranKetabMedia` | Every commit preflights all prepared objects with `HeadObject`; a retry repeats those checks and may re-download missing originals. | Retain the preflight for correctness; use a batch/list capability only if the storage provider supports it, and record prepared-object expiry. |

## C. Multi-edition root cause

There is no per-edition book-page crawl: the extractor derives editions and cover candidates from the single book HTML. The confirmed multi-edition amplification is downstream: unique contributor profile fetches during preview, selected cover download/Sharp transforms during preparation, per-edition storage `HeadObject`/copy during commit, and sequential edition/relation SQL writes. Before this patch, cover preparation was entirely serial; a slow image therefore blocked every later edition. The hard cap is 500 editions (`collection-limits.ts`), yielding a deterministic 422 rather than an infinite hang.

The visible “cannot identify” family is not a single root cause. URL/path validation yields non-retryable `INVALID_URL`/`UNSUPPORTED_*`; DNS is `DNS_FAILED` and retryable; HTML/parser changes are `PAGE_STRUCTURE_UNRECOGNIZED`/`PARSE_FAILED`; redirects are separately checked. Treating them all as one link error is an integration/UI presentation defect, not confirmed in this repository’s emitted API payload.

## D. Request/query budget

Let **P** be unique contributor profiles, **C** unique selected cover URLs, **E** selected editions, and **R** contributor relation rows. Current estimates exclude browser static assets:

| Scenario | External HTTP before patch | External HTTP after patch | DB reads before final write | DB writes/events before final write | Commit/storage work |
|---|---:|---:|---:|---:|---|
| 1 edition | `1 + 2P + C` | `1 + P + C` | 4–9 | >=6 | ~2 Heads + 1 copy + per-row SQL |
| 10 editions | `1 + 2P + C` | `1 + P + C` | 4–9 | >=6 | `2E` Heads + `E` copies; relation writes scale with R |
| 50 editions | `1 + 2P + C` | `1 + P + C` | 4–9 | >=6 | same linear storage/SQL scaling; covers were serial, now max 3 active |

The earlier image term was effectively selected-cover count even for a shared URL; it is now **C** network downloads/transforms plus **E** uploads, which is necessary because staged keys contain edition ownership metadata. Retry amplification was two profile attempts; it is now one by default. The target after structural refactoring is 1 page request, 0 profile requests on the critical path, C image downloads, 4–6 read queries, and bulk final writes.

## E. Recommended target architecture

1. Validate/canonicalize the submitted URL once and atomically acquire-or-return an import keyed by `iranketab:book:<id>`.
2. Fetch and parse the book page once; use the page’s edition data directly.
3. Run bounded batched matching. Do not fetch optional contributor profiles or images before the book/edition decisions require them.
4. For this admin workflow, return one draft/status response. Autosave only on explicit “save” or a longer debounced revision; do not record per-entity pseudo-events.
5. Prepare deduplicated images with bounded concurrency; treat image failure as a per-edition warning.
6. Commit using one transaction and bulk relation upserts. Return the existing result for a duplicate key or completed session.

Use a single `POST /imports` request for automatic imports, or retain the current three admin actions only where human review is required. Status may be returned synchronously for bounded imports; a queue is not justified until measured request deadlines are exceeded.

## F. Implementation plan

1. **Critical:** add a unique/indexed source identity and atomic insert-or-get session. Files: `db/schema.ts`, new migration, `session.ts`, preview route. This requires a migration and is intentionally not included in this focused patch.
2. **Low risk (completed):** canonical URL normalization; one optional profile attempt; bounded/deduplicated cover media work.
3. **Structural:** replace runtime `ALTER TYPE` calls in `session.ts` with migrations; replace contributor event loops with one stage summary; bulk-write editions/contributors in `commit.ts`; make profile hydration explicitly optional/lazy.
4. **Optional:** add a request-scoped metrics object and OpenTelemetry/log sink; add a storage batch-head adapter only when supported.

## G–I. Patch, tests, and observability

Changed files are listed in the repository diff. Tests now cover tracking-query normalization, strict URL behavior, and no implicit profile retry. Existing tests cover redirects, timeout, malformed HTML, duplicate preview slots, session lifecycle, cover validation, and idempotent commit behavior.

Existing structured logs cover media staging and commit checkpoints. Add one `iranketab.import.completed` log at each terminal path with `importId`, canonical source identity, stage durations, external request count, parser count, DB operation counters, discovered/imported/skipped editions, retries, and error category. Do not log raw HTML, URLs with credentials, cookies, or headers.

## J. Verification

Run:

```powershell
npm run typecheck
npx tsx --test packages/iranketab-extractor/tests/extractor.test.ts
npx tsx --test lib/importers/iranketab/secure-fetch.test.ts lib/importers/iranketab/cover-fetch.test.ts
```

For a measured before/after run, inject a counting `fetch`/storage adapter in preview and cover preparation; record unique URL, redirects, bytes, parser invocation, Sharp duration, and SQL query timing. Run one-, ten-, and fifty-edition fixtures plus concurrent same-link submissions against staging. Production DB-dependent tests cannot run without `DATABASE_URL`.

## Second-pass review — 2026-07-18

### Patch correctness

- `secure-fetch.ts` and extractor `validate-url.ts` now both require HTTPS, no credentials, no custom port, exact allowlisted host/path, and remove query/fragment. The server still performs DNS/IP validation; the extractor intentionally does not because it can be used with supplied HTML.
- `preview-handler.ts` now rejects a permitted-host redirect when it changes the numeric book identity. It parses from the final, validated redirect URL, preventing a session/source mismatch.
- `reference-profile.ts` makes **one total attempt** by default. Setting `maxAttempts: 2` enables one retry only for a thrown network/timeout failure, HTTP 429, or HTTP 5xx; 404 and invalid content type are not retried. The one retry has a bounded 100 ms linear delay. Profile failure remains non-blocking.
- `cover-preparation.ts` has no nested worker pool for book covers: at most `IRANKETAB_COVER_PREPARATION_CONCURRENCY` cover download/Sharp/upload chains are active. It caches the processed promise by cover URL, so duplicate URLs use one download and one Sharp transformation. A rejected cached promise means all editions using the same inaccessible URL receive the same independent per-edition `FAILED` result; successful unrelated covers continue.

Duplicate URL storage is only partially deduplicated by design. The data model stores `BookEdition.coverImage` as a string key and commit validates temporary-object metadata containing the exact edition index. Reusing one temporary object would fail that invariant; it would also make retry/cleanup ownership ambiguous. Therefore duplicate covers now cost **1 HTTP download + 1 transform + E uploads/temporary objects + E final copies** for E editions sharing that URL. Shared final keys would require a schema/storage ownership redesign and is not a low-risk patch.

### Measured synthetic Sharp benchmark

Command: `npx tsx scripts/benchmark-iranketab-cover-concurrency.ts`. This is a local, no-network/no-storage benchmark using a 1200×1800 JPEG and **unique** cover URLs, so it measures the worst case for the cache. RSS is process peak; CPU is process CPU milliseconds; event-loop p99 is milliseconds. It does not represent IranKetab latency, S3 latency, PostgreSQL, or production host capacity.

| Editions | Concurrency | Duration ms | CPU ms | Peak RSS MiB | p99 loop delay ms |
|---:|---:|---:|---:|---:|---:|
| 1 | 1 / 2 / 3 / 6 | 223 / 217 / 208 / 216 | 234 / 218 / 219 / 234 | 130 / 132 / 131 / 131 | 11.72 / 11.71 / 11.77 / 11.68 |
| 10 | 1 / 2 / 3 / 6 | 2004 / 1070 / 849 / 703 | 2094 / 2172 / 2250 / 2390 | 133 / 165 / 199 / 232 | 11.79 / 12.20 / 11.72 / 12.05 |
| 50 | 1 / 2 / 3 / 6 | 9954 / 5078 / 3662 / 2908 | 10314 / 10312 / 10969 / 11218 | 143 / 167 / 200 / 233 | 11.77 / 11.76 / 11.78 / 12.23 |

Concurrency 6 is fastest in this synthetic run but costs ~33 MiB more peak RSS than 3 for 50 covers and increases CPU work. Default 3 is the measured conservative compromise; set 6 only after repeating the benchmark on the production worker size and observing storage throttling/error rate. With duplicate cover URLs, HTTP/Sharp operation count is C (unique URLs), not E editions.

### Idempotency and user-facing error verdict

The server-side preview limiter is an in-memory, per-process 5-second duplicate guard. It protects a double-click handled by the same process, but does **not** protect a timeout retry after the window, two Node processes, a proxy retry, two users, or durable duplicate job delivery. The database has only a non-unique canonical URL index. Commit serialization uses advisory locks and prevents conflicting final writes, but it happens after duplicate preview work. A uniqueness-backed acquire-or-return import identity and concurrency integration test are still required.

The exact reported English link error is absent from the application, translation, and deployment files. The import UI preserves structured preview API messages when it receives JSON. It falls back to “connection to server failed” only when `fetch` rejects or `response.json()` fails; that is the only flattening component found: `app/admin/books/import-links/IranKetabPreviewClient.tsx:329–356`. A reverse proxy-generated response could trigger it, but cannot be identified from this repository.

The suite is now reliable without a database: the stale migration assertion expected 0028 to remain the final migration; the pure title test imported DB-coupled normalization code. Both were corrected without weakening behavior. `npm test` now passes 138 tests.

**Verdict: requires additional fixes before production.** The measured media concurrency default is defensible and the focused patch is correct, but durable preview idempotency is not present. Do not claim end-to-end request, query, storage, or latency reductions until the counting instrumentation is exercised against staging with real IranKetab and storage/database dependencies.

## Durable preview idempotency — final implementation

### Previous limitation and selected design

`rate-limit.ts` is still a useful same-process pressure guard, but it is not an idempotency guarantee. It cannot coordinate two server instances or a proxy retry. A new compact `IranKetabPreviewOperation` table was selected instead of extending `IranKetabImportSession`: sessions become user-owned drafts and hold user/session-scoped staged-media references after preview; a shared operation must never expose those references across admins.

The operation is source-derived only: `source_identity` is the existing `iranketab:book:<numeric-id>` generated by `canonicalIranKetabSourceIdentity`. It persists extraction, analysis, and preview JSON only—never HTML, credentials, cookies, headers, cover buffers, or staged object keys. All callers must still pass the existing admin authorization check. Source-derived preview data is safe to reuse between authorized admins; drafts, commits, and temporary media remain separate per-admin sessions.

### Schema, atomic algorithm, and recovery

Migration `0033_iranketab_preview_operations.sql` creates one row per source identity, a unique identity constraint, and a reclaim index on status/lease/result expiry. It is additive and safe to apply before the new code; old instances ignore the table.

`acquireOrGetIranKetabPreview` uses atomic insert-with-conflict handling. The winner receives `ACQUIRED`; concurrent callers observe `PROCESSING` and receive HTTP 202, `IRANKETAB_IMPORT_IN_PROGRESS`, operation ID, and `Retry-After`. A fresh `COMPLETED` payload is returned without external work. A retryable failure, an expired result, or an expired processing lease is reclaimed by a single guarded `UPDATE`; only that winner gets `RETRY_ACQUIRED`. The row has a generation counter, and completion/failure updates require that generation, fencing a late worker after its lease was reclaimed.

Lease default is 5 minutes (`IRANKETAB_PREVIEW_LEASE_MS`, range 1–15 minutes); completed result reuse default is 30 minutes (`IRANKETAB_PREVIEW_RESULT_TTL_MS`, range 1 minute–24 hours). A crashed worker is therefore reclaimable without a cron job. Failed non-retryable parser/validation failures remain stable; retryable network failures may be claimed by the next request. The current implementation uses application time for leases; staging should confirm hosts are NTP-synchronised. A later database-time conversion is possible if clock skew is a demonstrated concern.

### Guarantees and test design

Preview idempotency now protects the IranKetab page request, parsing, profile hydration, matching, and preview construction. It does not stage covers; cover work remains later and per-admin. Commit idempotency remains the existing advisory-lock/source-identity design and protects final catalog/storage writes independently.

`route-authorization.test.ts` runs concurrent handlers constructed independently with canonical, tracking-query, and fragment variants against one atomic-operation test double and a delayed fetch barrier. It proves one fetch and one analysis pipeline, one 200 owner response, and two 202 follower responses carrying the same operation ID. The migration test asserts the durable unique/reclaim indexes. A true two-connection PostgreSQL integration test must be run in staging because this local environment has no `DATABASE_URL`; do not label the database guarantee production-verified until it has run against the applied migration.

### Expected concurrent operation budget

For 1, 5, or 20 overlapping identical previews after migration: 1 main-page request, 0 edition-page requests, P profile requests, 0 cover/Sharp/storage work, 1 successful acquisition, 0/4/19 followers, and one operation record. Database reads/responses grow per follower, but external processing does not. These are algorithmic expectations, not staging measurements.

### Deployment, rollback, and remaining limitations

Deploy migration first, then code. Rollback application code is safe because the new table is unused by old versions; leave the additive table in place. No cleanup job is required because identity rows are intentionally reused and results are overwritten after expiry. Remaining required verification: run a two-connection PostgreSQL concurrency test and a staging load run with 1/5/20 requests to record real external request counters, storage work, wall time, and RSS. Until then, production readiness remains conditional on that database-backed validation.

## Final PostgreSQL Staging Verification — blocked

Verification was attempted on 2026-07-18 from commit `b0a62e6` using Node.js `v22.20.0`. The workspace process has no `DATABASE_URL`, PostgreSQL client tools (`psql`, `pg_isready`) are unavailable, and no explicitly identified disposable or staging PostgreSQL target was provided. Docker CLI is installed, but no accessible server/version was returned. The existing `.env` was deliberately not inspected or used because its target cannot be classified as disposable/staging without authorization.

Consequently, none of the following may be represented as measured: PostgreSQL version/pool configuration, migration execution, actual DDL/index output, independent-connection acquisition, independent-process requests, 1/5/20 load measurements, query plans, retention/cleanup, lease recovery, or generation fencing. The repository migration/static checks and mocked concurrent handler test pass, but they do not meet the required real-PostgreSQL acceptance criterion.

To unblock, provide an explicitly disposable/staging `DATABASE_URL` or a reachable Docker PostgreSQL server. Then run `npx drizzle-kit migrate`, inspect `\d+ "IranKetabPreviewOperation"`, `\d "IranKetabPreviewOperation"`, `\dT+ "IranKetabPreviewOperationStatus"`, and execute a two-pool 100-iteration contention test plus separate-process 1/5/20 API measurements. The migration is additive; rolling deployment must drain old preview-serving instances before enabling new traffic, because old instances do not consult `IranKetabPreviewOperation` and can duplicate work during a mixed-version rollout.

**Final staging verdict: requires additional fixes before production** until these real PostgreSQL checks are executed and recorded. The blocker is environment availability/authorization, not an asserted passing staging result.
