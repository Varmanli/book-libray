import { assertAdminApi } from "@/lib/admin/permissions";
import { apiSuccess } from "@/lib/api/response";
import { runScheduledDiscovery } from "@/lib/discovery/iranketab/scheduler";

export async function POST() {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  return apiSuccess(await runScheduledDiscovery());
}
