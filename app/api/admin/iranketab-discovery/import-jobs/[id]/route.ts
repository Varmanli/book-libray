import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { cancelImportJob, IranKetabDiscoveryImportQueueError, retryImportJob } from "@/lib/discovery/iranketab/import-queue";
import { iranKetabDiscoveryImportJobActionSchema } from "@/lib/validations/iranketab-discovery";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const parsed = iranKetabDiscoveryImportJobActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "درخواست نامعتبر است", 422);
  try {
    const job = parsed.data.action === "RETRY" ? await retryImportJob((await params).id) : await cancelImportJob((await params).id);
    return apiSuccess({ job, message: parsed.data.action === "RETRY" ? "کار ورود دوباره در صف قرار گرفت" : "کار ورود لغو شد" });
  } catch (error) {
    if (error instanceof IranKetabDiscoveryImportQueueError) {
      const message = error.code === "DISCOVERY_ITEM_NOT_FOUND"
        ? "نامزد کشف مرتبط با این کار ورود دیگر وجود ندارد"
        : "انجام این عملیات برای کار ورود ممکن نیست";
      return apiError(message, error.code === "DISCOVERY_ITEM_NOT_FOUND" ? 404 : 409, error.code);
    }
    throw error;
  }
}
