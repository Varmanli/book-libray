import { NextRequest } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { createAdminNote, listAdminNotes } from "@/lib/admin/user-content";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) { const gate = await assertAdminApi(); if ("error" in gate) return gate.error; const sp = req.nextUrl.searchParams; return apiSuccess(await listAdminNotes({ q: sp.get("q") ?? undefined, userId: sp.get("userId") ?? undefined, bookId: sp.get("bookId") ?? undefined, dateFrom: sp.get("dateFrom") ?? undefined, dateTo: sp.get("dateTo") ?? undefined, sort: sp.get("sort") ?? undefined, page: Math.max(1, Number(sp.get("page")) || 1) })); }
export async function POST(req: NextRequest) { const gate = await assertAdminApi(); if ("error" in gate) return gate.error; try { const note = await createAdminNote(await req.json()); return apiSuccess({ note, message: "یادداشت ایجاد شد" }, { status: 201 }); } catch (error) { return apiError(error instanceof Error ? error.message : "ایجاد یادداشت ناموفق بود", 422); } }
