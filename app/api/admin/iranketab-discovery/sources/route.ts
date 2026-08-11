import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  createIranKetabDiscoverySource,
  IranKetabDiscoverySourceError,
  IRANKETAB_DISCOVERY_SOURCE_PAGE_SIZE,
  listIranKetabDiscoverySources,
} from "@/lib/discovery/iranketab/source-service";
import {
  iranKetabDiscoverySourceInputSchema,
  listIranKetabDiscoverySourcesQuerySchema,
} from "@/lib/validations/iranketab-discovery";

export async function GET(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const parsed = listIranKetabDiscoverySourcesQuerySchema.safeParse({
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    q: req.nextUrl.searchParams.get("q") ?? undefined,
    sourceType: req.nextUrl.searchParams.get("sourceType") ?? undefined,
    crawlStatus: req.nextUrl.searchParams.get("crawlStatus") ?? undefined,
    enabled: req.nextUrl.searchParams.get("enabled") ?? undefined,
  });
  if (!parsed.success) return apiError("پارامترهای جست‌وجو نامعتبر است", 422);

  const { page, q, sourceType, crawlStatus, enabled } = parsed.data;
  return apiSuccess(
    await listIranKetabDiscoverySources({
      page,
      pageSize: IRANKETAB_DISCOVERY_SOURCE_PAGE_SIZE,
      q,
      sourceType: sourceType === "ALL" ? undefined : sourceType,
      crawlStatus: crawlStatus === "ALL" ? undefined : crawlStatus,
      enabled: enabled === "ALL" ? undefined : enabled === "true",
    }),
  );
}

export async function POST(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => null);
  const parsed = iranKetabDiscoverySourceInputSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است", 422);

  try {
    const source = await createIranKetabDiscoverySource(parsed.data, gate.user.id);
    return apiSuccess(
      { source, message: "منبع کشف ثبت شد" },
      { status: 201 },
    );
  } catch (error) {
    return serviceError(error);
  }
}

function serviceError(error: unknown) {
  if (
    error instanceof IranKetabDiscoverySourceError &&
    error.code === "DISCOVERY_SOURCE_ALREADY_EXISTS"
  )
    return apiError("کلید یا نشانی این منبع قبلاً ثبت شده است", 409, error.code);
  throw error;
}
