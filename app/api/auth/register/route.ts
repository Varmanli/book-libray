import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { registerApiSchema } from "@/lib/validations/auth";
import { AuthError, registerUser } from "@/lib/auth/service";
import { issueVerificationCode } from "@/lib/auth/verification-codes";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = rateLimit(getClientKey(req, "register"), {
    limit: 5,
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

  const parsed = registerApiSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است", 422);
  }

  try {
    const user = await registerUser(parsed.data);
    const codeResult = await issueVerificationCode({
      email: parsed.data.email,
      purpose: "email_verification",
    });
    return apiSuccess(
      {
        message: "ثبت‌نام با موفقیت انجام شد",
        user,
        requiresEmailVerification: true,
        ...(codeResult.devCode ? { devCode: codeResult.devCode } : {}),
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return apiError(err.message, err.status, err.code);
    }
    console.error("❌ register error:", err);
    return apiError("خطای سرور. بعداً دوباره تلاش کنید.", 500);
  }
}
