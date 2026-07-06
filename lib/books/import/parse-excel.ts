import * as XLSX from "xlsx";

import {
  groupBooks,
  mapExcelRowKeys,
  normalizeFlatRowToBook,
} from "@/lib/books/import/normalize";
import type { NormalizedImportBook } from "@/lib/books/import/types";

export function parseImportExcel(buffer: ArrayBuffer): NormalizedImportBook[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("EXCEL_SHEET_NOT_FOUND");

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  const books = rows.map((row, index) =>
    normalizeFlatRowToBook(mapExcelRowKeys(row), index + 2),
  );

  return groupBooks(books);
}
