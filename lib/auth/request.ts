import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";

export async function requireRequestUser(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false as const,
      response: apiError("توکن نامعتبر است یا نشست منقضی شده است", 401, "UNAUTHENTICATED"),
    };
  }

  return { ok: true as const, user };
}
