import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { getAdminBookEditionsDebug } from "@/lib/admin/service";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const catalogBookId = req.nextUrl.searchParams.get("catalogBookId")?.trim();
  if (!catalogBookId) {
    return apiError("شناسه کتاب لازم است", 400, "CATALOG_BOOK_ID_REQUIRED");
  }

  const payload = await getAdminBookEditionsDebug(catalogBookId);
  if (!payload) {
    return apiError("کتاب پیدا نشد", 404, "CATALOG_BOOK_NOT_FOUND");
  }

  return apiSuccess(payload);
}
