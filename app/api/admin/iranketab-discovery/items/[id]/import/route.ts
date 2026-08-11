import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  IranKetabDiscoveryImportBridgeError,
  startDiscoveryImport,
} from "@/lib/discovery/iranketab/import-bridge";

type Context = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  try {
    const { id } = await params;
    const result = await startDiscoveryImport(id, gate.user.id);
    return apiSuccess({
      session: result.session,
      reused: result.reused,
      message: result.reused
        ? "نشست ورود قبلی بازیابی شد"
        : "پیش‌نمایش ورود آماده شد",
    });
  } catch (error) {
    if (error instanceof IranKetabDiscoveryImportBridgeError) {
      const status = error.code === "DISCOVERY_ITEM_NOT_FOUND" ? 404
        : error.code === "DISCOVERY_ITEM_NOT_QUEUED" || error.code === "DISCOVERY_IMPORT_ALREADY_RUNNING" ? 409
          : error.code === "DISCOVERY_ITEM_INVALID_URL" ? 422 : 502;
      return apiError(error.message, status, error.code);
    }
    throw error;
  }
}
