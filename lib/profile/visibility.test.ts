import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { getTableConfig } from "drizzle-orm/pg-core";

import { User } from "@/db/schema";
import {
  updateProfileSchema,
  updateProfileVisibilitySchema,
} from "@/lib/validations/profile";

test("new users have a PUBLIC database/ORM default", () => {
  const config = getTableConfig(User);
  const visibility = config.columns.find(
    (column) => column.name === "profile_visibility",
  );

  assert.equal(visibility?.default, "PUBLIC");
  assert.equal(visibility?.notNull, true);
});

test("visibility has a dedicated strict mutation contract", () => {
  assert.deepEqual(updateProfileVisibilitySchema.parse({ visibility: "PUBLIC" }), {
    visibility: "PUBLIC",
  });
  assert.deepEqual(updateProfileVisibilitySchema.parse({ visibility: "PRIVATE" }), {
    visibility: "PRIVATE",
  });
  assert.equal(
    updateProfileVisibilitySchema.safeParse({ visibility: "FRIENDS" }).success,
    false,
  );

  // The general profile DTO deliberately strips visibility, forcing callers
  // through the minimal PATCH path.
  assert.deepEqual(
    updateProfileSchema.parse({ name: "A", visibility: "PRIVATE" }),
    { name: "A" },
  );
});

test("the production migration changes only the future-row default", () => {
  const migration = readFileSync(
    new URL("../../drizzle/0025_public_profile_default.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /ALTER COLUMN "profile_visibility" SET DEFAULT 'PUBLIC'/);
  assert.doesNotMatch(migration, /\bUPDATE\b|\bDELETE\b|\bTRUNCATE\b|DROP\s+TABLE/i);
});
