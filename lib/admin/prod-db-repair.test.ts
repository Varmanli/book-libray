import assert from "node:assert/strict";
import test from "node:test";

import { repairPreviewOperationSchema } from "../../scripts/prod-db-repair.mjs";

type Row = Record<string, unknown>;

const columns = [
  ["id", "character varying", null, "NO", "gen_random_uuid()"],
  ["source_identity", "text", null, "NO", null],
  ["status", "USER-DEFINED", "IranKetabPreviewOperationStatus", "NO", "'PROCESSING'::\"IranKetabPreviewOperationStatus\""],
  ["lease_expires_at", "timestamp without time zone", null, "YES", null],
  ["expires_at", "timestamp without time zone", null, "YES", null],
  ["result", "jsonb", null, "YES", null],
  ["error_code", "text", null, "YES", null],
  ["error_message", "text", null, "YES", null],
  ["retryable", "boolean", null, "NO", "false"],
  ["generation", "integer", null, "NO", "1"],
  ["created_at", "timestamp without time zone", null, "NO", "now()"],
  ["updated_at", "timestamp without time zone", null, "NO", "now()"],
].map(([column_name, data_type, udt_name, is_nullable, column_default]) => ({ column_name, data_type, udt_name, is_nullable, column_default }));

class PreviewSchemaPool {
  enumExists = false;
  enumLabels = ["PROCESSING", "COMPLETED", "FAILED"];
  tableExists = false;
  indexExists = false;
  readonly data = [{ id: "existing-operation", source_identity: "existing" }];
  readonly statements: string[] = [];

  async query(statement: string, ..._parameters: unknown[]): Promise<{ rows: Row[] }> {
    this.statements.push(statement);
    if (statement.startsWith("BEGIN") || statement.startsWith("COMMIT") || statement.startsWith("ROLLBACK")) return { rows: [] };
    if (statement.includes("FROM pg_type t")) {
      return { rows: this.enumExists ? [{ enum_kind: "e", enum_labels: this.enumLabels }] : [] };
    }
    if (statement.includes("to_regclass('public.\"IranKetabPreviewOperation\"')")) {
      return { rows: [{ table_name: this.tableExists ? "IranKetabPreviewOperation" : null }] };
    }
    if (statement.includes("FROM information_schema.columns")) return { rows: columns };
    if (statement.includes("FROM pg_constraint")) {
      return { rows: [
        { conname: "IranKetabPreviewOperation_pkey", definition: "PRIMARY KEY (id)" },
        { conname: "IranKetabPreviewOperation_source_identity_unique", definition: "UNIQUE (source_identity)" },
      ] };
    }
    if (statement.includes("FROM pg_index")) {
      return { rows: this.indexExists ? [{ definition: 'CREATE INDEX "IranKetabPreviewOperation_reclaim_idx" ON public."IranKetabPreviewOperation" USING btree (status, lease_expires_at, expires_at)' }] : [] };
    }
    if (statement.startsWith('CREATE TYPE public."IranKetabPreviewOperationStatus"')) {
      this.enumExists = true;
      return { rows: [] };
    }
    if (statement.startsWith('CREATE TABLE public."IranKetabPreviewOperation"')) {
      this.tableExists = true;
      return { rows: [] };
    }
    if (statement.startsWith('CREATE INDEX "IranKetabPreviewOperation_reclaim_idx"')) {
      this.indexExists = true;
      return { rows: [] };
    }
    throw new Error(`Unexpected SQL in test: ${statement}`);
  }
}

test("preview-operation repair creates 0033 objects once and preserves existing data", async () => {
  const pool = new PreviewSchemaPool();

  await repairPreviewOperationSchema(pool);
  assert.equal(pool.enumExists, true);
  assert.equal(pool.tableExists, true);
  assert.equal(pool.indexExists, true);
  assert.deepEqual(pool.data, [{ id: "existing-operation", source_identity: "existing" }]);
  assert.equal(pool.statements.filter((statement) => statement.startsWith("CREATE ")).length, 3);

  await repairPreviewOperationSchema(pool);
  assert.equal(pool.statements.filter((statement) => statement.startsWith("CREATE ")).length, 3, "second execution must not recreate objects");
  assert.deepEqual(pool.data, [{ id: "existing-operation", source_identity: "existing" }]);
});

test("preview-operation enum inspection uses JSON so pg returns a JavaScript array", async () => {
  const pool = new PreviewSchemaPool();

  await repairPreviewOperationSchema(pool);

  const enumInspection = pool.statements.find((statement) => statement.includes("FROM pg_type t"));
  assert.match(enumInspection ?? "", /json_agg\(e\.enumlabel ORDER BY e\.enumsortorder\)/);
  assert.doesNotMatch(enumInspection ?? "", /array_agg\(/);
});

test("preview-operation repair refuses incomplete or conflicting existing objects without touching data", async () => {
  const incomplete = new PreviewSchemaPool();
  incomplete.enumExists = true;
  incomplete.tableExists = true;
  await assert.rejects(() => repairPreviewOperationSchema(incomplete), /reclaim_idx does not match migration 0033/);
  assert.deepEqual(incomplete.data, [{ id: "existing-operation", source_identity: "existing" }]);
  assert.equal(incomplete.statements.some((statement) => statement.startsWith("CREATE ")), false);

  const conflicting = new PreviewSchemaPool();
  conflicting.enumExists = true;
  conflicting.enumLabels = ["PROCESSING", "COMPLETED"];
  await assert.rejects(() => repairPreviewOperationSchema(conflicting), /enum IranKetabPreviewOperationStatus must be exactly/);
  assert.deepEqual(conflicting.data, [{ id: "existing-operation", source_identity: "existing" }]);
  assert.equal(conflicting.statements.some((statement) => statement.startsWith("CREATE ")), false);
});
