import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getIranKetabDiscoveryCandidate } from "@/lib/discovery/iranketab/candidate-service";
import { getImportSession } from "@/lib/importers/iranketab/session";

type Context = { params: Promise<{ id: string }> };

/** Opens the established importer review UI; the commit endpoint remains authoritative. */
export async function POST(_req: Request, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const item = await getIranKetabDiscoveryCandidate((await params).id);
  if (!item) return apiError("نامزد کشف یافت نشد", 404, "DISCOVERY_ITEM_NOT_FOUND");
  if (item.status !== "APPROVED" || !item.importSessionId)
    return apiError("نامزد برای ثبت نهایی تأیید نشده است", 409, "DISCOVERY_IMPORT_NOT_APPROVED");
  const session = await getImportSession(item.importSessionId);
  if (!session || session.session.adminId !== gate.user.id)
    return apiError("نشست ورود برای این مدیر قابل بررسی نیست", 409, "DISCOVERY_IMPORT_SESSION_UNAVAILABLE");
  return apiSuccess({ reviewUrl: "/admin/books/import-links", sessionId: item.importSessionId });
}
