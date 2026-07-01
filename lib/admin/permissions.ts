import { redirect } from "next/navigation";

import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { apiError } from "@/lib/api/response";

/**
 * Server-side admin gate for pages/layouts. Redirects unauthenticated users to
 * login and non-admins to a safe 403 page. Returns the admin user otherwise.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/admin");
  if (!isAdmin(user)) redirect("/forbidden");
  return user;
}

/**
 * Admin gate for route handlers. Returns the user on success, or a ready-made
 * 401/403 response to return directly:
 *   const gate = await assertAdminApi();
 *   if ("error" in gate) return gate.error;
 *   const { user } = gate;
 */
export async function assertAdminApi(): Promise<
  { user: SessionUser } | { error: ReturnType<typeof apiError> }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: apiError("احراز هویت نشده", 401, "UNAUTHENTICATED") };
  }
  if (!isAdmin(user)) {
    return { error: apiError("دسترسی غیرمجاز", 403, "FORBIDDEN") };
  }
  return { user };
}
