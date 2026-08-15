import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { parseUserBookUpdate } from "./user-mutation";

test("regular users can update only personal library state", () => {
  const result = parseUserBookUpdate({
    status: "READING",
    rating: 4,
    isFavorite: true,
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data, {
      status: "READING",
      rating: 4,
      isFavorite: true,
    });
  }
});

test("regular users can create or update a ten-point rating with reading feelings", () => {
  const result = parseUserBookUpdate({
    rating: 9,
    moodTags: ["عمیق", "الهام‌بخش", "عمیق"],
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data, {
      rating: 9,
      moodTags: ["عمیق", "الهام‌بخش"],
    });
  }
});

test("regular users can update personal reading information independently", () => {
  const result = parseUserBookUpdate({
    status: "FINISHED",
    review: "تجربه‌ی خواندنی و ماندگار بود.",
    isFavorite: true,
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data, {
      status: "FINISHED",
      review: "تجربه‌ی خواندنی و ماندگار بود.",
      isFavorite: true,
    });
  }
});

test("regular users cannot submit canonical Book metadata", () => {
  for (const metadata of [
    { title: "عنوان تغییرکرده" },
    { author: "نویسنده تغییرکرده" },
    { genre: "ژانر تغییرکرده" },
    { coverImage: "https://example.test/cover.jpg" },
    { pageCount: 123 },
  ]) {
    assert.deepEqual(parseUserBookUpdate(metadata), {
      success: false,
      error: "فقط اطلاعات شخصیِ مطالعه قابل بروزرسانی است",
    });
  }
});

test("library cards no longer expose the edit flow but keep deletion", () => {
  const source = readFileSync("components/library/LibraryBookCard.tsx", "utf8");

  assert.doesNotMatch(source, /\/books\/edit/);
  assert.doesNotMatch(source, />ویرایش</);
  assert.match(source, /onDelete\?\.\(book\)/);
  assert.match(source, />حذف کتاب</);
});

test("the former user edit route is gone while admin editing remains available", () => {
  assert.equal(existsSync("app/(dashboard)/books/edit/[id]/page.tsx"), false);
  assert.equal(existsSync("app/admin/books/[id]/edit/page.tsx"), true);
  assert.match(
    readFileSync("app/api/admin/books/[id]/route.ts", "utf8"),
    /updateAdminCatalogBook/,
  );
});
