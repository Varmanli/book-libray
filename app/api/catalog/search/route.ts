import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { searchCatalog } from "@/lib/catalog/service";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return apiSuccess({ results: [] });
  }

  try {
    const results = await searchCatalog(q);
    return apiSuccess({ results });
  } catch (err) {
    console.error("❌ catalog/search error:", err);
    return apiError("خطا در جست‌وجوی کاتالوگ", 500);
  }
}
