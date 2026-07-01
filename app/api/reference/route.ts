import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { referenceTypeSchema } from "@/lib/validations/reference";
import { searchReference } from "@/lib/reference/service";

// جست‌وجوی مقادیر مرجعِ تأییدشده برای کمبوباکس فرم افزودن کتاب
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");

  const typeParsed = referenceTypeSchema.safeParse(
    req.nextUrl.searchParams.get("type")
  );
  if (!typeParsed.success) return apiError("نوع نامعتبر است", 422);

  const q = req.nextUrl.searchParams.get("q") ?? "";

  try {
    const items = await searchReference(typeParsed.data, q, {
      approvedOnly: true,
    });
    return apiSuccess({ items });
  } catch (err) {
    console.error("❌ reference search error:", err);
    return apiError("خطا در جست‌وجو", 500);
  }
}
