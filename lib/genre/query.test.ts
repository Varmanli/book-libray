import assert from "node:assert/strict";
import test from "node:test";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { catalogGenreContains, eligibleGenreRows } from "./query";

test("eligible genre archive rows retain public slugs with approved-book counts", () => {
  const rows = eligibleGenreRows([
    { slug: "novel", bookCount: 12 },
    { slug: "empty", bookCount: 0 },
    { slug: null, bookCount: 7 },
  ]);
  assert.deepEqual(rows, [{ slug: "novel", bookCount: 12 }]);
});

test("Genre catalog matching retains every supported separator", () => {
  const query = new PgDialect().sqlToQuery(
    catalogGenreContains(sql`book.genre`, "ادبیات"),
  );

  assert.match(query.sql, /regexp_split_to_table/);
  assert.match(query.sql, /\\n\\r،,;؛•/);
});
