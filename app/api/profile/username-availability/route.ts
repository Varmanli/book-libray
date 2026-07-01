import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { usernameSchema } from "@/lib/validations/profile";
import { isUsernameAvailable } from "@/lib/profile/service";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");

  const raw = req.nextUrl.searchParams.get("username") ?? "";
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) {
    return apiSuccess({
      available: false,
      valid: false,
      error: parsed.error.issues[0]?.message,
    });
  }

  const available = await isUsernameAvailable(parsed.data, user.id);
  return apiSuccess({ available, valid: true });
}
