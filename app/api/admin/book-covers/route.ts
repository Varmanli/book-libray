import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { COVER_RECENT_IMPORT_DAYS } from "@/lib/admin/book-covers.shared";
import {
  listAdminBookCovers,
} from "@/lib/admin/book-covers";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(Number(searchParams.get("page") || "1") || 1, 1);
  const pageSize = 20;

  const result = await listAdminBookCovers({
    q: searchParams.get("q") ?? "",
    onlyMissing: searchParams.get("missing") !== "false",
    recentOnly: searchParams.get("recent") === "true",
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return apiSuccess({
    items: result.items,
    total: result.total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
    recentImportDays: COVER_RECENT_IMPORT_DAYS,
  });
}

export function POST() {
  return apiError("این مسیر فقط برای دریافت فهرست استفاده می‌شود.", 405);
}
