import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { listDiscoveryImportJobs } from "@/lib/discovery/iranketab/import-queue";
import { listIranKetabDiscoveryImportJobsQuerySchema } from "@/lib/validations/iranketab-discovery";

export async function GET(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const parsed = listIranKetabDiscoveryImportJobsQuerySchema.safeParse({
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    status: req.nextUrl.searchParams.get("status") ?? undefined,
    from: req.nextUrl.searchParams.get("from") ?? undefined,
    to: req.nextUrl.searchParams.get("to") ?? undefined,
    minimumPriority: req.nextUrl.searchParams.get("minimumPriority") ?? undefined,
  });
  if (!parsed.success) return apiError("پارامترهای جست‌وجو نامعتبر است", 422);
  return apiSuccess(await listDiscoveryImportJobs({
    ...parsed.data,
    status: parsed.data.status === "ALL" ? undefined : parsed.data.status,
  }));
}
