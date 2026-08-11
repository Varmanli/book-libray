import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  IRANKETAB_DISCOVERY_ITEM_PAGE_SIZE,
  listIranKetabDiscoveryCandidates,
} from "@/lib/discovery/iranketab/candidate-service";
import { listIranKetabDiscoveryItemsQuerySchema } from "@/lib/validations/iranketab-discovery";

export async function GET(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const parsed = listIranKetabDiscoveryItemsQuerySchema.safeParse({
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    q: req.nextUrl.searchParams.get("q") ?? undefined,
    status: req.nextUrl.searchParams.get("status") ?? undefined,
    importConfidence:
      req.nextUrl.searchParams.get("importConfidence") ?? undefined,
    minimumPriorityScore:
      req.nextUrl.searchParams.get("minimumPriorityScore") ?? undefined,
    sourceId: req.nextUrl.searchParams.get("sourceId") ?? undefined,
  });
  if (!parsed.success) return apiError("پارامترهای جست‌وجو نامعتبر است", 422);

  const {
    page,
    q,
    status,
    importConfidence,
    minimumPriorityScore,
    sourceId,
  } = parsed.data;
  return apiSuccess(
    await listIranKetabDiscoveryCandidates({
      page,
      pageSize: IRANKETAB_DISCOVERY_ITEM_PAGE_SIZE,
      q,
      status: status === "ALL" ? undefined : status,
      importConfidence:
        importConfidence === "ALL" ? undefined : importConfidence,
      minimumPriorityScore,
      sourceId,
    }),
  );
}
