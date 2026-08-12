import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { approveAndEnqueueDiscoveryItems, processDiscoveryImportQueueBatch } from "@/lib/discovery/iranketab/import-queue";
import { enqueueIranKetabDiscoveryItemsSchema } from "@/lib/validations/iranketab-discovery";

export async function POST(req: Request) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const parsed = enqueueIranKetabDiscoveryItemsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "درخواست نامعتبر است", 422);
  const summary = await approveAndEnqueueDiscoveryItems(parsed.data.discoveryItemIds, parsed.data.discoverySourceId);
  const processing = await processDiscoveryImportQueueBatch(`admin:${gate.user.id}`, summary.queued + summary.reused, gate.user.id);
  return apiSuccess({ ...summary, processing, message: "کتاب‌های انتخاب‌شده به صف ورود ارسال شدند" });
}
