import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(path.join(process.cwd(), "app/admin/books/import-links/IranKetabDraftReview.tsx"), "utf8");
const preview = readFileSync(path.join(process.cwd(), "app/admin/books/import-links/IranKetabPreviewClient.tsx"), "utf8");

test("top workflow control and mobile-safe bottom spacing remain rendered", () => {
  assert.match(source, /data-testid="import-workflow-top-control"/);
  assert.match(source, /createPortal/);
  assert.match(source, /pb-40 sm:pb-32/);
});

test("blocking actions have focusable workflow targets", () => {
  for (const marker of ["data-workflow-catalog", "data-workflow-entity-unresolved", "data-workflow-edition", "data-workflow-conflict", "data-workflow-cover-errors"]) assert.match(source, new RegExp(marker));
  assert.match(source, /scrollIntoView/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
});

test("every required workflow action is visible in the shared action model", () => {
  for (const label of ["تکمیل انتخاب کتاب", "تکمیل مراجع حل‌نشده", "تکمیل تصمیم نسخه‌ها", "بررسی تعارض‌ها", "بررسی خطاهای پیش‌نویس", "آماده‌سازی کاورها", "تلاش مجدد برای کاورهای ناموفق", "بررسی خطاهای کاور", "ثبت نهایی کتاب و نسخه‌ها", "در حال ثبت کتاب، نسخه‌ها و کاورها..."]) assert.match(source, new RegExp(label));
});

test("only one primary next-step control is mounted", () => {
  const calls = source.match(/<WorkflowActionSummary readiness=/g) ?? [];
  assert.equal(calls.length, 1);
});

test("completed technical details and edition cards are collapsed by default", () => {
  assert.match(source, /<details className=/);
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /const \[open, setOpen\] = useState<number \| null>\(null\)/);
});

test("contributor import is a distinct persisted workflow step before commit", () => {
  const ui = readFileSync(path.join(process.cwd(), "app/admin/books/import-links/IranKetabImporterUi.tsx"), "utf8");
  const session = readFileSync(path.join(process.cwd(), "lib/importers/iranketab/session.ts"), "utf8");
  assert.match(ui, /بررسی پدیدآورندگان/);
  assert.match(source, /iranketab-contributor-step/);
  assert.match(session, /CONTRIBUTOR_STEP_STARTED/);
  assert.match(session, /CONTRIBUTOR_STEP_COMPLETED/);
});

test("new import reset switches to fresh mode before async cleanup", () => {
  assert.match(preview, /const \[isFreshImport, setIsFreshImport\] = useState\(true\)/);
  assert.match(preview, /setIsFreshImport\(true\);[\s\S]*setResult\(null\)/);
  assert.match(preview, /onClick=\{handleNewImport\}/);
  assert.match(preview, /key=\{`\$\{result\.sessionId\}-\$\{resetGeneration\}`\}/);
  assert.match(preview, /iranketab:explicit-reset/);
});

test("summary view mounts the initial IranKetab URL form", () => {
  assert.match(preview, /view = "summary"/);
  assert.match(preview, /aria-label="نشانی صفحه کتاب ایران‌کتاب"/);
  assert.match(preview, /<Button type="submit" disabled=\{loading \|\| !url\.trim\(\)\}/);
  assert.match(preview, /<form onSubmit=\{submit\} className="mt-4 flex flex-col gap-2 sm:flex-row">/);
});
