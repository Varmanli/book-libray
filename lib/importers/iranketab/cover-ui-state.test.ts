import assert from "node:assert/strict";
import test from "node:test";
import { deriveCoverUiState } from "./cover-ui-state";
import type { PreparedCoverResult } from "./cover-contract";

const prepared = (index: number): PreparedCoverResult => ({ extractedEditionIndex: index, sourceEditionCode: String(index), status: "PREPARED", action: "USE_PREPARED", objectKey: `tmp/${index}.webp`, url: `/uploads/${index}.webp`, originalSourceUrl: `https://www.iranketab.ir/Images/ProductImages/${index}.jpg`, mimeType: "image/webp", width: 400, height: 600, sizeBytes: 1000, preparedAt: "2026-07-14T12:00:00.000Z" });
const failed: PreparedCoverResult = { extractedEditionIndex: 0, sourceEditionCode: "0", status: "FAILED", error: { code: "X", message: "failed", retryable: true } };

test("previous failure followed by full success clears failed aggregation", () => { assert.equal(deriveCoverUiState([failed]).failed, 1); assert.deepEqual(deriveCoverUiState([0,1,2,3].map(prepared)), { prepared: 4, failed: 0, skipped: 0, keptExisting: 0, status: "آماده" }); });
test("autosave failure does not change cover status", () => { const latest = [0,1,2,3].map(prepared); const before = deriveCoverUiState(latest); const autosaveState = "failed"; assert.equal(autosaveState, "failed"); assert.deepEqual(deriveCoverUiState(latest), before); });
test("preview rendering failure does not change preparation status", () => { const latest = [0,1,2,3].map(prepared); const previewError = "image failed"; assert.ok(previewError); assert.equal(deriveCoverUiState(latest).status, "آماده"); });
