import { NextRequest } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { cancelImportSession, saveImportDraft } from "@/lib/importers/iranketab/session";
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const body = (await req.json().catch(() => null)) as {
    draft?: unknown;
    extraction?: unknown;
  } | null;
  if (!body?.draft)
    return apiError("پیش‌نویس معتبر نیست", 400, "INVALID_DRAFT");
  try {
    return apiSuccess({
      session: await saveImportDraft(
        (await params).id,
        gate.user.id,
        body as { draft: unknown; extraction?: unknown },
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("حداکثر مجاز") || message.includes("ساختار")) return apiError(message, 422, "INVALID_DRAFT");
    return apiError("فرآیند وارد کردن پیدا نشد", 404, "SESSION_NOT_FOUND");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  try {
    await cancelImportSession((await params).id, gate.user.id);
    return apiSuccess({ ok: true });
  } catch {
    return apiError("فرآیند وارد کردن پیدا نشد", 404, "SESSION_NOT_FOUND");
  }
}
