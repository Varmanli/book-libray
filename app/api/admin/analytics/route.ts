import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { getAdminAnalytics, parseAnalyticsPeriod } from "@/lib/admin/analytics";
import { apiSuccess } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const period = parseAnalyticsPeriod(request.nextUrl.searchParams.get("period") ?? undefined);
  return apiSuccess({ analytics: await getAdminAnalytics(period) });
}
