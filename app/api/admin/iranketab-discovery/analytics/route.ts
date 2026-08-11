import { assertAdminApi } from "@/lib/admin/permissions";
import { apiSuccess } from "@/lib/api/response";
import { getDiscoveryOverview, getRecentActivity, getSourcePerformance } from "@/lib/discovery/iranketab/analytics";

export async function GET() {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const [overview, sourcePerformance, recentActivity] = await Promise.all([
    getDiscoveryOverview(),
    getSourcePerformance(),
    getRecentActivity(),
  ]);
  return apiSuccess({ overview, sourcePerformance, recentActivity });
}
