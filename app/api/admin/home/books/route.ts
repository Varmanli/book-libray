import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { searchAdminCatalogBooks } from "@/lib/admin/service";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");
  if (!isAdmin(user)) return apiError("دسترسی غیرمجاز", 403, "FORBIDDEN");

  const q = req.nextUrl.searchParams.get("q") ?? "";
  // هویت کانونی = CatalogBook؛ id برابر catalogBookId است. خروجی شامل اطلاعات
  // کافی برای انتخابگر (عنوان اصلی، ناشر/مترجم) با fallback جلدِ آرشیو عمومی.
  const results = await searchAdminCatalogBooks(q, { limit: 12 });
  return apiSuccess({ results });
}
