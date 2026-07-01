import { apiError, apiSuccess } from "@/lib/api/response";
import { assertAdminApi } from "@/lib/admin/permissions";
import { checkStorageConnectivity } from "@/lib/server/s3";

export const runtime = "nodejs";

// تشخیصِ ادمین: بررسی این‌که سرور می‌تواند به فضای ذخیره‌سازی متصل شود.
export async function GET() {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  try {
    const result = await checkStorageConnectivity();
    return apiSuccess({ health: result });
  } catch {
    return apiError("بررسی اتصال ذخیره‌سازی ناموفق بود.", 500);
  }
}
