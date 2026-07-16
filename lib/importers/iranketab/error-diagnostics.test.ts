import assert from "node:assert/strict";
import test from "node:test";

import { StorageError } from "@/lib/server/s3";
import {
  IranKetabCommitError,
  promotionFailure,
  wrapIranKetabCommitError,
} from "./commit-errors";
import { developmentErrorPayload, diagnosticFor } from "./commit-api-diagnostics";
import {
  attachErrorCheckpoint,
  attachErrorCheckpointIfMissing,
  checkpoint,
  lastCheckpointInChain,
  serializeErrorChain,
} from "./error-diagnostics";

test("nested storage errors survive commit wrapping and API diagnostics", () => {
  const provider = Object.assign(new Error("provider denied copy"), {
    name: "AccessDenied",
    code: "AccessDenied",
  });
  const storage = new StorageError(
    "Storage access denied during CopyObject.",
    "STORAGE_FORBIDDEN",
    provider,
    {
      functionName: "copyImageInS3",
      stage: "before_copy",
      lastCheckpoint: "before_copy",
      destinationKey: "covers/final.webp",
      copyObject: { ok: false },
      providerErrorCode: "AccessDenied",
      requestId: "request-123",
    },
  );
  const cp = checkpoint(
    "before_copy",
    "promoteMedia",
    "copy",
    "copyImageUpload(preparedCover.objectKey, finalKey)",
  );
  const commit = promotionFailure(storage, true, cp);

  assert.ok(commit instanceof IranKetabCommitError);
  assert.equal(commit.code, "COVER_PROMOTION_FAILED");
  assert.strictEqual(commit.cause, storage);
  assert.strictEqual(storage.cause, provider);
  assert.deepEqual(
    serializeErrorChain(commit).map(({ name, code, message }) => ({ name, code, message })),
    [
      { name: "IranKetabCommitError", code: "COVER_PROMOTION_FAILED", message: "انتقال امن کاور به فضای نهایی ناموفق بود." },
      { name: "StorageError", code: "STORAGE_FORBIDDEN", message: "Storage access denied during CopyObject." },
      { name: "AccessDenied", code: "AccessDenied", message: "provider denied copy" },
    ],
  );
  const diagnostic = diagnosticFor(commit, { draft: {} });
  assert.equal(diagnostic.providerErrorCode, "AccessDenied");
  assert.equal(diagnostic.requestId, "request-123");
  assert.equal(diagnostic.lastCheckpoint, "before_copy");
  const api = developmentErrorPayload(commit, { draft: {} }, true);
  assert.equal(api.errorChain?.[1].code, "STORAGE_FORBIDDEN");
  assert.equal(api.lastCheckpoint, "before_copy");
});

test("a pre-promotion failure is not labeled as a cover promotion failure", () => {
  const original = new Error("existing link query failed");
  const cp = checkpoint(
    "before_existing_links_query",
    "commitIranKetabImport",
    "pre_promotion",
    "query existing IranKetab links",
  );
  const unchanged = promotionFailure(original, false, cp);
  assert.strictEqual(unchanged, original);

  const commit = wrapIranKetabCommitError(
    "DATABASE_TRANSACTION_FAILED",
    "تراکنش ثبت کتاب انجام نشد.",
    unchanged,
    cp,
  );
  assert.equal(commit.code, "DATABASE_TRANSACTION_FAILED");
  assert.notEqual(commit.code, "COVER_PROMOTION_FAILED");
  assert.strictEqual(commit.cause, original);
});

test("lastCheckpoint reports the exact last executed storage stage", () => {
  const error = new Error("source head failed");
  attachErrorCheckpoint(
    error,
    checkpoint(
      "before_source_head",
      "promoteMedia",
      "source_metadata_lookup",
      "headImageUpload(preparedCover.objectKey)",
    ),
  );
  const outer = new IranKetabCommitError("COVER_PROMOTION_FAILED", undefined, error);
  assert.equal(lastCheckpointInChain(outer), "before_source_head");
  assert.equal(serializeErrorChain(outer)[1].statement, "headImageUpload(preparedCover.objectKey)");
});

test("diagnostics stay on the actual thrown error instead of a stale outer object", () => {
  const actual = new Error("actual failure");
  attachErrorCheckpoint(
    actual,
    checkpoint("before_fallback_put", "copyImageInS3", "fallback_put", "client.send(PutObjectCommand)"),
  );
  const outer = new IranKetabCommitError("COVER_PROMOTION_FAILED", undefined, actual);
  attachErrorCheckpointIfMissing(
    outer,
    checkpoint("before_commit_iranketab_import", "commit route", "commit_call", "commitIranKetabImport(...)"),
  );

  assert.equal(lastCheckpointInChain(outer), "before_fallback_put");
  assert.equal(serializeErrorChain(outer)[1].functionName, "copyImageInS3");
});
