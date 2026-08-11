import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  IranKetabDiscoverySourceError,
  setIranKetabDiscoverySourceEnabled,
} from "@/lib/discovery/iranketab/source-service";
import { setIranKetabDiscoverySourceEnabledSchema } from "@/lib/validations/iranketab-discovery";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = setIranKetabDiscoverySourceEnabledSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است", 422);

  try {
    const source = await setIranKetabDiscoverySourceEnabled(id, parsed.data.enabled);
    return apiSuccess({ source, message: parsed.data.enabled ? "منبع فعال شد" : "منبع غیرفعال شد" });
  } catch (error) {
    if (
      error instanceof IranKetabDiscoverySourceError &&
      error.code === "DISCOVERY_SOURCE_NOT_FOUND"
    )
      return apiError("منبع کشف یافت نشد", 404, error.code);
    throw error;
  }
}
