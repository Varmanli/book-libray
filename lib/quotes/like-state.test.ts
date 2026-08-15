import assert from "node:assert/strict";
import test from "node:test";

import { normalizeQuoteLikeState } from "./like-state";

test("an already-liked feed item preserves its persisted count and viewer state", () => {
  assert.deepEqual(normalizeQuoteLikeState(1, true), {
    likeCount: 1,
    likedByViewer: true,
  });
});

test("a viewer who has not liked an item is represented as unliked", () => {
  assert.deepEqual(normalizeQuoteLikeState(3, false), {
    likeCount: 3,
    likedByViewer: false,
  });
});

test("anonymous and null aggregate states safely resolve to unliked", () => {
  assert.deepEqual(normalizeQuoteLikeState(0, null), {
    likeCount: 0,
    likedByViewer: false,
  });
});
