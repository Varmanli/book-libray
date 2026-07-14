import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(path.join(process.cwd(), "app/admin/books/import-links/IranKetabPreviewClient.tsx"), "utf8");
test("main workflow action portal is placed directly after the IranKetab URL form", () => {
  const formEnd = source.indexOf("</form>");
  const control = source.indexOf('id="iranketab-workflow-control"');
  assert.ok(formEnd > -1 && control > formEnd && control - formEnd < 150);
});
