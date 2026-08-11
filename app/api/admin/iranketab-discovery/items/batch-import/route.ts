import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { enqueueManyDiscoveryItems } from "@/lib/discovery/iranketab/import-queue";
import { enqueueIranKetabDiscoveryItemsSchema } from "@/lib/validations/iranketab-discovery";

export async function POST(req: Request) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => null);
  const parsed = enqueueIranKetabDiscoveryItemsSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "درخواست نامعتبر است", 422);
  const results = await enqueueManyDiscoveryItems(parsed.data.discoveryItemIds);
  return apiSuccess({ results, message: "نامزدهای واجد شرایط به صف ورود اضافه شدند" });
}
