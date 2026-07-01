import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { loginSchema } from "@/lib/validations/auth";
import { AuthError, authenticateUser, createAuthTokenForUser } from "@/lib/auth/service";
import { setAuthCookie } from "@/lib/auth/cookies";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = rateLimit(getClientKey(req, "login"), {
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return apiError(
      "تلاش‌های ناموفق زیاد بود. کمی بعد دوباره تلاش کنید.",
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "ایمیل، نام کاربری یا رمز عبور اشتباه است",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  try {
    const user = await authenticateUser(parsed.data);
    const token = await createAuthTokenForUser(user.id);

    const res = apiSuccess({ message: "ورود موفق", user });
    setAuthCookie(res, token, parsed.data.rememberMe);
    return res;
  } catch (err) {
    if (err instanceof AuthError) {
      return apiError(err.message, err.status, err.code);
    }
    console.error("❌ login error:", err);
    return apiError("خطای سرور. بعداً دوباره تلاش کنید.", 500);
  }
}
