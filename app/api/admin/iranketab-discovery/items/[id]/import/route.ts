import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  enqueueDiscoveryItem,
  processDiscoveryImportQueueBatch,
} from "@/lib/discovery/iranketab/import-queue";
import { IranKetabDiscoveryImportQueueError } from "@/lib/discovery/iranketab/import-queue";

type Context = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  try {
    const { id } = await params;
    await enqueueDiscoveryItem(id);
    const result = await processDiscoveryImportQueueBatch(`admin:${gate.user.id}`, 1, gate.user.id);
    return apiSuccess({
      processing: result,
      message: result.processed ? "پیش‌نمایش ورود پردازش شد" : "کار ورود در صف قرار گرفت",
    });
  } catch (error) {
    if (error instanceof IranKetabDiscoveryImportQueueError) {
      const status = error.code === "DISCOVERY_ITEM_NOT_FOUND" ? 404 : 409;
      return apiError(error.message, status, error.code);
    }
    throw error;
  }
}
