import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  deleteIranKetabDiscoverySource,
  getIranKetabDiscoverySource,
  IranKetabDiscoverySourceError,
  updateIranKetabDiscoverySource,
} from "@/lib/discovery/iranketab/source-service";
import { updateIranKetabDiscoverySourceSchema } from "@/lib/validations/iranketab-discovery";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const { id } = await params;
  const source = await getIranKetabDiscoverySource(id);
  if (!source) return apiError("منبع کشف یافت نشد", 404, "DISCOVERY_SOURCE_NOT_FOUND");
  return apiSuccess({ source });
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateIranKetabDiscoverySourceSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است", 422);

  try {
    await updateIranKetabDiscoverySource(id, parsed.data);
    const source = await getIranKetabDiscoverySource(id);
    return apiSuccess({ source, message: "منبع کشف به‌روزرسانی شد" });
  } catch (error) {
    if (
      error instanceof IranKetabDiscoverySourceError &&
      error.code === "DISCOVERY_SOURCE_NOT_FOUND"
    )
      return apiError("منبع کشف یافت نشد", 404, error.code);
    if (
      error instanceof IranKetabDiscoverySourceError &&
      error.code === "DISCOVERY_SOURCE_ALREADY_EXISTS"
    )
      return apiError("کلید یا نشانی این منبع قبلاً ثبت شده است", 409, error.code);
    throw error;
  }
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const { id } = await params;
  try {
    await deleteIranKetabDiscoverySource(id);
    return apiSuccess({ message: "منبع کشف حذف شد" });
  } catch (error) {
    if (
      error instanceof IranKetabDiscoverySourceError &&
      error.code === "DISCOVERY_SOURCE_NOT_FOUND"
    )
      return apiError("منبع کشف یافت نشد", 404, error.code);
    if (
      error instanceof IranKetabDiscoverySourceError &&
      error.code === "DISCOVERY_SOURCE_NOT_EMPTY"
    )
      return apiError(
        "منبع دارای سابقه کشف است؛ آن را غیرفعال کنید",
        409,
        error.code,
      );
    throw error;
  }
}
