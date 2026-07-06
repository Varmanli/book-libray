import { NextRequest } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/admin/permissions";
import { previewBulkCoverMatches } from "@/lib/admin/book-covers";
import { apiError, apiSuccess } from "@/lib/api/response";

const bulkPreviewSchema = z.object({
  filenames: z.array(z.string().min(1)).min(1),
  onlyMissing: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست نامعتبر است.", 400);
  }

  const parsed = bulkPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("فهرست فایل‌ها معتبر نیست.", 422, "INVALID_FILENAMES");
  }

  const result = await previewBulkCoverMatches(parsed.data.filenames, {
    onlyMissing: parsed.data.onlyMissing ?? true,
  });

  return apiSuccess({ ...result });
}
