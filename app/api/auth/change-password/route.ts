import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/validations/auth";
import { AuthError, changePassword } from "@/lib/auth/service";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست نامعتبر است", 400);
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است", 422);
  }

  try {
    await changePassword(
      user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );
    return apiSuccess({ message: "رمز عبور با موفقیت تغییر کرد" });
  } catch (err) {
    if (err instanceof AuthError) {
      return apiError(err.message, err.status, err.code);
    }
    console.error("❌ change-password error:", err);
    return apiError("خطا در تغییر رمز عبور", 500);
  }
}
