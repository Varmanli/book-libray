import { NextRequest } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { cleanupIranKetabCovers } from "@/lib/importers/iranketab/cover-preparation";
export const runtime = "nodejs";
export async function POST(req: NextRequest) { const gate = await assertAdminApi(); if ("error" in gate) return gate.error; const body = await req.json().catch(() => null) as { draftFingerprint?: unknown; objectKeys?: unknown } | null; if (!body || typeof body.draftFingerprint !== "string" || !Array.isArray(body.objectKeys) || body.objectKeys.some(key => typeof key !== "string")) return apiError("درخواست پاک‌سازی معتبر نیست", 400, "INVALID_DRAFT"); return apiSuccess({ results: await cleanupIranKetabCovers(gate.user.id, body.draftFingerprint, body.objectKeys) }); }
