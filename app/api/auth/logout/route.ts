import { apiSuccess } from "@/lib/api/response";
import { clearAuthCookie } from "@/lib/auth/cookies";

export async function POST() {
  const res = apiSuccess({ message: "خروج موفق" });
  clearAuthCookie(res);
  return res;
}
