import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { IranKetabDiscoveryScheduleError, runManualDiscoverySource, runScheduledDiscovery } from "@/lib/discovery/iranketab/scheduler";
import { executeIranKetabDiscoveryRunRequest } from "@/lib/discovery/iranketab/run-request";

export async function POST(req: Request) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  try {
    const result = await executeIranKetabDiscoveryRunRequest(
      await req.json().catch(() => ({})),
      { runManualDiscoverySource, runScheduledDiscovery },
    );
    if (!result.ok) return apiError("درخواست اجرای کشف نامعتبر است", 400, result.code);
    // Keep the established scheduler response shape when no source is specified.
    return result.manual
      ? apiSuccess({ result: result.result })
      : apiSuccess(result.result as Record<string, unknown>);
  } catch (error) {
    if (error instanceof IranKetabDiscoveryScheduleError) {
      const status = error.code === "DISCOVERY_SOURCE_NOT_FOUND" ? 404 : 409;
      return apiError(error.message, status, error.code);
    }
    return apiError("اجرای کشف ناموفق بود", 500, "DISCOVERY_RUN_FAILED");
  }
}
