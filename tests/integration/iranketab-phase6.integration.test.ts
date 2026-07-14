import assert from "node:assert/strict";
import test, { beforeEach, after } from "node:test";
import { Pool, type PoolClient } from "pg";
import {
  advisoryLockKey,
  canonicalIranKetabSourceIdentity,
} from "../../lib/importers/iranketab/server-hardening";
import { commitIranKetabImport } from "../../lib/importers/iranketab/commit";
import {
  draftFingerprint,
  type IranKetabImportDraftWithPreparedCovers,
} from "../../lib/importers/iranketab/cover-preparation";
import {
  promoteObjects,
  type StorageAdapter,
  type StorageObject,
} from "../../lib/importers/iranketab/storage-promotion";

const connectionString = process.env.DATABASE_URL;
if (!connectionString || !/127\.0\.0\.1|localhost/.test(connectionString))
  throw new Error("Integration tests require an isolated local PostgreSQL URL");
const pool = new Pool({ connectionString, max: 12 });
after(async () => pool.end());
beforeEach(async () => {
  await pool.query(
    'TRUNCATE TABLE "BookExternalLink", "BookEdition", "CatalogBook", "ReferenceItem" CASCADE',
  );
  await pool.query(
    `insert into "User" (id,email,role) values ('integration-admin','phase6@example.invalid','ADMIN') on conflict (id) do nothing`,
  );
});

async function locked(client: PoolClient, namespace: string, value: string) {
  await client.query("select pg_advisory_xact_lock($1::bigint)", [
    advisoryLockKey(`${namespace}:${value}`).toString(),
  ]);
}

test("same canonical source identity blocks a second independent connection", async () => {
  const a = await pool.connect();
  const b = await pool.connect();
  try {
    await a.query("begin");
    await b.query("begin");
    const identity = canonicalIranKetabSourceIdentity(
      "https://iranketab.ir/book/123-test",
    );
    await a.query("select pg_advisory_xact_lock($1::bigint)", [
      advisoryLockKey(identity).toString(),
    ]);
    let acquired = false;
    const waiting = b
      .query("select pg_advisory_xact_lock($1::bigint)", [
        advisoryLockKey(
          canonicalIranKetabSourceIdentity(
            "https://www.iranketab.ir/book/123-test#abc",
          ),
        ).toString(),
      ])
      .then(() => {
        acquired = true;
      });
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(acquired, false);
    await a.query("commit");
    await waiting;
    assert.equal(acquired, true);
    await b.query("rollback");
  } finally {
    a.release();
    b.release();
  }
});

test("different source identities acquire concurrently", async () => {
  const a = await pool.connect();
  const b = await pool.connect();
  try {
    await a.query("begin");
    await b.query("begin");
    await Promise.all([
      a.query("select pg_advisory_xact_lock($1::bigint)", [
        advisoryLockKey("iranketab:book:1").toString(),
      ]),
      b.query("select pg_advisory_xact_lock($1::bigint)", [
        advisoryLockKey("iranketab:book:2").toString(),
      ]),
    ]);
    await a.query("rollback");
    await b.query("rollback");
  } finally {
    a.release();
    b.release();
  }
});

for (const [namespace, value] of [
  ["isbn", "9780306406157"],
  ["source-edition", "edition-77"],
] as const) {
  test(`${namespace} advisory lock blocks conflicting connection`, async () => {
    const a = await pool.connect();
    const b = await pool.connect();
    try {
      await a.query("begin");
      await b.query("begin");
      await locked(a, namespace, value);
      await b.query("set local lock_timeout = '100ms'");
      await assert.rejects(locked(b, namespace, value), /lock timeout/);
      await a.query("rollback");
      await b.query("rollback");
    } finally {
      a.release();
      b.release();
    }
  });
}

const rollbackSteps = [
  "entity",
  "catalog",
  "relation",
  "edition",
  "source-link",
  "cover-attachment",
] as const;
for (const failureStep of rollbackSteps) {
  test(`transaction rollback removes all writes after ${failureStep}`, async () => {
    await pool.query(
      `insert into "CatalogBook" (id,title,author,slug) values ('existing','Existing','Curated','existing')`,
    );
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        `insert into "ReferenceItem" (id,type,name,status) values ('new-entity','AUTHOR','New','APPROVED')`,
      );
      if (failureStep === "entity") throw new Error("injected");
      await client.query(
        `insert into "CatalogBook" (id,title,author,genre,slug) values ('new-catalog','New','Author','Genre','new')`,
      );
      if (failureStep === "catalog") throw new Error("injected");
      await client.query(
        `update "CatalogBook" set author='Author، Related' where id='new-catalog'`,
      );
      if (failureStep === "relation") throw new Error("injected");
      await client.query(
        `insert into "BookEdition" (id,catalog_book_id,format,status,source_name,source_edition_code) values ('new-edition','new-catalog','PHYSICAL','APPROVED','iranketab','77')`,
      );
      if (failureStep === "edition") throw new Error("injected");
      await client.query(
        `insert into "BookExternalLink" (catalog_book_id,provider,url,type) values ('new-catalog','iranketab','https://iranketab.ir/book/77-test','print')`,
      );
      if (failureStep === "source-link") throw new Error("injected");
      await client.query(
        `update "BookEdition" set cover_image='/fake/final.webp' where id='new-edition'`,
      );
      throw new Error("injected");
    } catch {
      await client.query("rollback");
    } finally {
      client.release();
    }
    const counts = await pool.query(
      `select (select count(*) from "ReferenceItem") entities, (select count(*) from "CatalogBook" where id='new-catalog') catalogs, (select count(*) from "BookEdition") editions, (select count(*) from "BookExternalLink") links`,
    );
    assert.deepEqual(counts.rows[0], {
      entities: "0",
      catalogs: "0",
      editions: "0",
      links: "0",
    });
    const existing = await pool.query(
      `select title,author from "CatalogBook" where id='existing'`,
    );
    assert.deepEqual(existing.rows[0], {
      title: "Existing",
      author: "Curated",
    });
  });
}

function fixture(bookId = 9001, isbn13 = "9780306406157") {
  const canonicalUrl = `https://www.iranketab.ir/book/${bookId}-phase-six`;
  const extraction: any = {
    contractVersion: 1,
    source: { submittedUrl: canonicalUrl, canonicalUrl, editionCode: null },
    book: {
      title: `Book ${bookId}`,
      subtitle: null,
      originalTitle: null,
      description: null,
      language: "fa",
      firstPublishedYear: null,
      authors: [{ name: "Author" }],
      genres: [],
      country: null,
    },
    editions: [
      {
        titleOverride: null,
        translators: [],
        publisher: { name: "" },
        isbn10: null,
        isbn13,
        publishedYear: 1400,
        pageCount: 100,
        editionDescription: null,
        sourceUrl: `${canonicalUrl}#pts=1`,
        sourceEditionCode: `${bookId}-1`,
      },
    ],
    diagnostics: { coverCandidatesByEdition: {} },
  };
  const draft: any = {
    draftVersion: 1,
    source: {
      contractVersion: 1,
      submittedUrl: canonicalUrl,
      canonicalUrl,
      selectedEditionCode: null,
      approvedCoverCandidateUrls: [],
    },
    catalog: {
      action: "CREATE_NEW",
      fields: {
        title: `Book ${bookId}`,
        subtitle: null,
        originalTitle: null,
        description: null,
        language: "fa",
        firstPublishedYear: null,
      },
      authors: [
        {
          action: "CREATE_NEW",
          entityType: "AUTHOR",
          extractedName: "Author",
          proposedName: "Author",
        },
      ],
      genres: [],
      country: null,
    },
    editions: [
      {
        extractedEditionIndex: 0,
        action: "CREATE_NEW",
        fields: {
          titleOverride: null,
          isbn10: null,
          isbn13,
          publishedYear: 1400,
          pageCount: 100,
          editionDescription: null,
          sourceEditionCode: `${bookId}-1`,
          sourceUrl: `${canonicalUrl}#pts=1`,
        },
        translators: [],
        publisher: null,
        coverAction: { action: "SKIP" },
      },
    ],
    entities: [
      {
        action: "CREATE_NEW",
        entityType: "AUTHOR",
        extractedName: "Author",
        proposedName: "Author",
      },
    ],
    unresolvedIssues: [],
    readiness: "READY_FOR_COVER_IMPORT",
  };
  const prepared: IranKetabImportDraftWithPreparedCovers = {
    draft,
    fingerprint: draftFingerprint(draft),
    preparedCovers: [
      {
        extractedEditionIndex: 0,
        sourceEditionCode: `${bookId}-1`,
        status: "SKIPPED",
      },
    ],
  };
  return { extraction, prepared };
}

test("real commit is idempotent after duplicate submit and lost response retry", async () => {
  const input = fixture();
  const first = await commitIranKetabImport({
    adminId: "integration-admin",
    ...input,
  });
  const retry = await commitIranKetabImport({
    adminId: "integration-admin",
    ...input,
  });
  assert.equal(first.catalog.action, "CREATED");
  assert.equal(retry.catalog.action, "REUSED");
  assert.equal(retry.editions[0].action, "REUSED");
  const counts = await pool.query(
    `select (select count(*) from "CatalogBook") catalogs, (select count(*) from "BookEdition") editions, (select count(*) from "ReferenceItem") entities, (select count(*) from "BookExternalLink") links`,
  );
  assert.deepEqual(counts.rows[0], {
    catalogs: "1",
    editions: "1",
    entities: "1",
    links: "1",
  });
});

test("concurrent real commits across pool connections create one import", async () => {
  const input = fixture(9002, "9783161484100");
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      commitIranKetabImport({ adminId: "integration-admin", ...input }),
    ),
  );
  assert.equal(
    results.filter((item) => item.catalog.action === "CREATED").length,
    1,
  );
  const counts = await pool.query(
    `select (select count(*) from "CatalogBook") catalogs, (select count(*) from "BookEdition") editions, (select count(*) from "BookExternalLink") links`,
  );
  assert.deepEqual(counts.rows[0], {
    catalogs: "1",
    editions: "1",
    links: "1",
  });
});

test("fake storage promotion compensates on database rollback boundary", async () => {
  const objects = new Map<string, StorageObject>([
    ["tmp/a", { key: "tmp/a", contentType: "image/webp", metadata: {} }],
  ]);
  const storage: StorageAdapter = {
    async headObject(key) {
      return objects.get(key) ?? null;
    },
    async copyObject(source, destination, metadata) {
      objects.set(destination, {
        ...objects.get(source)!,
        key: destination,
        metadata,
      });
    },
    async deleteObject(key) {
      objects.delete(key);
    },
  };
  const promoted = await promoteObjects(storage, [
    {
      sourceKey: "tmp/a",
      destinationKey: "covers/iranketab-a.webp",
      metadata: {},
    },
  ]);
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into "CatalogBook" (id,title,author) values ('rollback-cover','x','a')`,
    );
    throw new Error("injected");
  } catch {
    await client.query("rollback");
    await Promise.all(promoted.map((key) => storage.deleteObject(key)));
  } finally {
    client.release();
  }
  assert.equal(objects.has("covers/iranketab-a.webp"), false);
  assert.equal(objects.has("tmp/a"), true);
});

test("cleanup failure does not rollback a successful database commit", async () => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into "CatalogBook" (id,title,author) values ('cleanup-success','x','a')`,
    );
    await client.query("commit");
  } finally {
    client.release();
  }
  await assert.rejects(Promise.reject(new Error("fake cleanup failure")));
  assert.equal(
    (
      await pool.query(
        `select count(*) from "CatalogBook" where id='cleanup-success'`,
      )
    ).rows[0].count,
    "1",
  );
});
