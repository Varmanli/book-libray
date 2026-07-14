import assert from "node:assert/strict";
import test from "node:test";
import { acquireIranKetabPreviewSlot, resetIranKetabPreviewLimiterForTests } from "./rate-limit";

test("preview limiter blocks concurrent and short-window duplicate requests",()=>{
  resetIranKetabPreviewLimiterForTests(); const first=acquireIranKetabPreviewSlot("admin","https://iranketab.ir/book/1-test",1000); assert.ok("release" in first);
  const concurrent=acquireIranKetabPreviewSlot("admin","https://iranketab.ir/book/2-test",1001); assert.deepEqual("release" in concurrent?null:concurrent.code,"ALREADY_RUNNING");
  if("release" in first) first.release(); const duplicate=acquireIranKetabPreviewSlot("admin","https://iranketab.ir/book/1-test",1002); assert.deepEqual("release" in duplicate?null:duplicate.code,"DUPLICATE_REQUEST");
});
