import { NextRequest } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { uploadReferenceMedia } from "@/lib/reference/profile-import";

export const runtime = "nodejs";

const matchSchema = z.object({
  filename: z.string().min(1),
  relativePath: z.string().nullish(),
  referenceId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const formData = await req.formData();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return apiError("هیچ فایل تصویری برای آپلود ارسال نشده است.", 400, "NO_MEDIA_FILES");
  }

  const rawMatches = formData.get("matches");
  if (typeof rawMatches !== "string" || !rawMatches.trim()) {
    return apiError("نقشه‌ی اتصال فایل‌ها ارسال نشده است.", 422, "MISSING_MATCH_MAP");
  }

  let parsedMatches: z.infer<typeof matchSchema>[];
  try {
    const decoded = JSON.parse(rawMatches);
    const parsed = z.array(matchSchema).safeParse(decoded);
    if (!parsed.success) {
      return apiError("نقشه‌ی اتصال فایل‌ها معتبر نیست.", 422, "INVALID_MATCH_MAP");
    }
    parsedMatches = parsed.data;
  } catch {
    return apiError("نقشه‌ی اتصال فایل‌ها معتبر نیست.", 422, "INVALID_MATCH_MAP");
  }

  const result = await uploadReferenceMedia(files, parsedMatches);
  return apiSuccess({ ...result });
}
