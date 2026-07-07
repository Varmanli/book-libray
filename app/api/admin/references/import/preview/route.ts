import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { previewReferenceProfiles } from "@/lib/reference/profile-import";

export async function POST(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست نامعتبر است.", 400);
  }

  const profiles =
    body && typeof body === "object" && "profiles" in body
      ? (body as { profiles?: unknown }).profiles
      : body;

  const result = await previewReferenceProfiles(profiles);
  return apiSuccess({ ...result });
}
