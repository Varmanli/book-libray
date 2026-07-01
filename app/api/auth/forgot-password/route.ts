import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { issueVerificationCode } from "@/lib/auth/verification-codes";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = rateLimit(getClientKey(req, "forgot"), {
    limit: 3,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return apiError(
      "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.",
      429,
      "RATE_LIMITED"
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست نامعتبر است", 400);
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "ایمیل نامعتبر است", 422);
  }

  // پیام عمومی همیشه یکسان است تا وجود/نبود ایمیل لو نرود
  const genericMessage =
    "اگر این ایمیل در سیستم ثبت شده باشد، کد بازیابی برای آن ارسال شد.";

  try {
    const { devCode } = await issueVerificationCode({
      email: parsed.data.email,
      purpose: "password_reset",
      requireExistingUser: true,
    });
    return apiSuccess({ message: genericMessage, ...(devCode ? { devCode } : {}) });
  } catch (err) {
    console.error("❌ forgot-password error:", err);
    // باز هم پیام عمومی برمی‌گردانیم تا اطلاعات لو نرود
    return apiSuccess({ message: genericMessage });
  }
}
