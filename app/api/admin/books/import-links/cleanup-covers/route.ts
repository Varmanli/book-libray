import { NextRequest } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { cleanupIranKetabCovers } from "@/lib/importers/iranketab/cover-preparation";
import { getImportSession } from "@/lib/importers/iranketab/session";
export const runtime = "nodejs";
export async function POST(req: NextRequest) { const gate = await assertAdminApi(); if ("error" in gate) return gate.error; const body = await req.json().catch(() => null) as { sessionId?: unknown; draftFingerprint?: unknown; objectKeys?: unknown; reason?: unknown } | null; if (!body || typeof body.sessionId !== "string" || typeof body.draftFingerprint !== "string" || !Array.isArray(body.objectKeys) || body.objectKeys.some(key => typeof key !== "string") || !["cancelled", "expired"].includes(String(body.reason))) return apiError("درخواست پاک‌سازی معتبر نیست", 400, "INVALID_DRAFT"); const session = await getImportSession(body.sessionId); if (!session || session.session.adminId !== gate.user.id || (body.reason === "cancelled" && session.session.status !== "CANCELLED")) return apiError("نشست برای پاک‌سازی مجاز نیست", 409, "SESSION_NOT_CLEANABLE"); return apiSuccess({ results: await cleanupIranKetabCovers(gate.user.id, body.sessionId, body.draftFingerprint, body.objectKeys, body.reason as "cancelled" | "expired") }); }
