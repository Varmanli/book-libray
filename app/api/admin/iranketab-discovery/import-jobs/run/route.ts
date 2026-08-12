import { assertAdminApi } from "@/lib/admin/permissions";
import { apiSuccess } from "@/lib/api/response";
import { processDiscoveryImportQueueBatch } from "@/lib/discovery/iranketab/import-queue";

/** One bounded, authenticated worker pass. Cron or an admin can invoke this endpoint repeatedly. */
export async function POST() {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  return apiSuccess(await processDiscoveryImportQueueBatch(`admin:${gate.user.id}`, 10, gate.user.id));
}
