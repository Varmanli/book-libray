import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");
    }
    return apiSuccess({ user });
  } catch (err) {
    console.error("❌ auth/me error:", err);
    return apiError("خطای سرور", 500);
  }
}
