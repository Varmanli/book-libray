import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { commitSuccessSchema } from "./commit-contract";

const review = readFileSync(path.join(process.cwd(), "app/admin/books/import-links/IranKetabDraftReview.tsx"), "utf8");
const preview = readFileSync(path.join(process.cwd(), "app/admin/books/import-links/IranKetabPreviewClient.tsx"), "utf8");
const success = readFileSync(path.join(process.cwd(), "app/admin/books/import-links/IranKetabImportSuccess.tsx"), "utf8");
const response = { ok: true, result: { catalog: { id: "book", title: "ناتوان", action: "CREATED" }, editions: [{ extractedEditionIndex: 0, action: "CREATED", editionId: "edition", catalogId: "book", coverAction: "ATTACHED" }], entities: { created: [], reused: [] }, warnings: [] }, sessionId: "session", sessionStatus: "SUCCESS", urls: { admin: "/admin/books/book/edit", public: "/book/book", history: "/admin/books/import-history/session" } };

test("successful top-level commit response is accepted", () => assert.equal(commitSuccessSchema.safeParse(response).success, true));
test("successful commit replaces review UI and advances stepper to terminal stage", () => { assert.match(review, /if \(commitResult\)[\s\S]*IranKetabImportSuccess/); assert.match(review, /commitResult \? 5/); assert.match(preview, /terminalSuccess \? 5/); });
test("commit button disappears and duplicate request remains guarded after success", () => { assert.match(review, /commitGuard\.current = true/); assert.match(review, /if \(!terminalRef\.current\) commitGuard\.current = false/); assert.doesNotMatch(success, /ثبت نهایی کتاب و نسخه‌ها/); });
test("autosave and recovery cannot overwrite terminal success", () => { assert.match(review, /terminalRef\.current \|\| commitResult/); assert.match(preview, /terminalSuccessRef\.current/); });
test("refresh restores success and starting another import clears it", () => { assert.match(preview, /sessionStorage\.getItem\("iranketab:last-success"\)/); assert.match(preview, /sessionStorage\.removeItem\("iranketab:last-success"\)/); });
test("success result exposes admin, public, history and restart actions", () => { for (const label of ["مشاهده کتاب", "ویرایش کتاب", "مشاهده جزئیات ورود", "ورود کتاب دیگر"]) assert.match(success, new RegExp(label)); });
