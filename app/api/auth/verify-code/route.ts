import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api/response";
import { setAuthCookie } from "@/lib/auth/cookies";
import { AuthError, createAuthTokenForUser } from "@/lib/auth/service";
import { verifyVerificationCode } from "@/lib/auth/verification-codes";
import { verifyCodeSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست نامعتبر است", 400);
  }

  const parsed = verifyCodeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "کد تایید نامعتبر است.",
      422
    );
  }

  try {
    const result = await verifyVerificationCode(parsed.data);

    if (parsed.data.purpose === "login" && result.status === "verified" && result.userId) {
      const token = await createAuthTokenForUser(result.userId);
      const response = apiSuccess({ message: "ورود با موفقیت انجام شد." });
      setAuthCookie(response, token, true);
      return response;
    }

    if (parsed.data.purpose === "email_verification") {
      return apiSuccess({ message: "ایمیل شما با موفقیت تایید شد." });
    }

    return apiSuccess({
      message: "کد تایید شد.",
      ...(result.status === "verified" && result.resetToken
        ? { resetToken: result.resetToken }
        : {}),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status, error.code);
    }

    console.error("❌ verify-code error:", error);
    return apiError("خطای سرور. بعداً دوباره تلاش کنید.", 500);
  }
}
