import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api/response";
import { searchReferencePage } from "@/lib/reference/service";

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

/** Public, paginated source for progressively loading the authors directory. */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const page = parsePositiveInteger(req.nextUrl.searchParams.get("page"), 1);
    const pageSize = Math.min(
      100,
      parsePositiveInteger(req.nextUrl.searchParams.get("limit"), 20),
    );
    const result = await searchReferencePage("AUTHOR", q, {
      approvedOnly: true,
      page,
      pageSize,
    });

    return apiSuccess({
      items: result.items,
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.page < result.pageCount,
    });
  } catch (error) {
    console.error("[authors] failed to load a page:", error);
    return apiError("خطا در دریافت نویسنده‌ها", 500);
  }
}
