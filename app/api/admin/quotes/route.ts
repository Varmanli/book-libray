import { NextRequest } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { createAdminQuote, listAdminQuotes } from "@/lib/admin/user-content";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const gate = await assertAdminApi(); if ("error" in gate) return gate.error;
  const sp = req.nextUrl.searchParams;
  const result = await listAdminQuotes({ q: sp.get("q") ?? undefined, userId: sp.get("userId") ?? undefined, bookId: sp.get("bookId") ?? undefined, contentType: sp.get("contentType") ?? undefined, dateFrom: sp.get("dateFrom") ?? undefined, dateTo: sp.get("dateTo") ?? undefined, sort: sp.get("sort") ?? undefined, page: Math.max(1, Number(sp.get("page")) || 1) });
  return apiSuccess(result);
}
export async function POST(req: NextRequest) {
  const gate = await assertAdminApi(); if ("error" in gate) return gate.error;
  try { const quote = await createAdminQuote(await req.json()); return apiSuccess({ quote, message: "تکه با موفقیت ایجاد شد" }, { status: 201 }); }
  catch (error) { return apiError(error instanceof Error ? error.message : "ایجاد تکه ناموفق بود", 422); }
}
