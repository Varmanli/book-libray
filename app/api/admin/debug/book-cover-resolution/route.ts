import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { getAdminBookCoverResolution } from "@/lib/admin/service";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const catalogBookId = req.nextUrl.searchParams.get("catalogBookId")?.trim();
  if (!catalogBookId) {
    return apiError("پارامتر catalogBookId الزامی است.", 400, "MISSING_CATALOG_BOOK_ID");
  }

  const result = await getAdminBookCoverResolution(catalogBookId);
  if (!result) {
    return apiError("کتاب کاتالوگ پیدا نشد.", 404, "CATALOG_BOOK_NOT_FOUND");
  }

  return apiSuccess({ ...result });
}
