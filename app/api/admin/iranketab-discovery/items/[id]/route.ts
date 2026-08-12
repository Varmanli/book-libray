import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  getIranKetabDiscoveryCandidate,
  IranKetabDiscoveryCandidateError,
  reviewIranKetabDiscoveryCandidate,
} from "@/lib/discovery/iranketab/candidate-service";
import { iranKetabDiscoveryCandidateActionSchema } from "@/lib/validations/iranketab-discovery";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const { id } = await params;
  const item = await getIranKetabDiscoveryCandidate(id);
  if (!item) return apiError("نامزد کشف یافت نشد", 404, "DISCOVERY_ITEM_NOT_FOUND");
  return apiSuccess({ item });
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = iranKetabDiscoveryCandidateActionSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.issues[0]?.message ?? "درخواست نامعتبر است", 422);

  try {
    const item = await reviewIranKetabDiscoveryCandidate(id, parsed.data.action);
    return apiSuccess({ item, message: actionMessage(parsed.data.action) });
  } catch (error) {
    if (error instanceof IranKetabDiscoveryCandidateError) {
      if (error.code === "DISCOVERY_ITEM_NOT_FOUND") return apiError("نامزد کشف یافت نشد", 404, error.code);
      const message = error.code === "DISCOVERY_PREVIEW_REQUIRED"
        ? "پیش‌نمایش آماده برای تأیید وجود ندارد"
        : "این تغییر وضعیت در مرحله فعلی مجاز نیست";
      return apiError(message, 409, error.code);
    }
    throw error;
  }
}

function actionMessage(action: "IGNORE" | "NEEDS_REVIEW" | "APPROVE_FOR_IMPORT") {
  if (action === "IGNORE") return "نامزد نادیده گرفته شد";
  if (action === "NEEDS_REVIEW") return "نامزد برای بررسی نگه داشته شد";
  return "نامزد برای صف ورود تأیید شد";
}
