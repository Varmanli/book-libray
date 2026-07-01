import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api/response";
import { assertAdminApi } from "@/lib/admin/permissions";
import { adminSetUserRole } from "@/lib/admin/service";
import { setRoleSchema } from "@/lib/validations/admin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const { id } = await params;

  // Prevent an admin from removing their own admin role (lockout safety).
  if (id === gate.user.id) {
    return apiError("نمی‌توانی نقش خودت را تغییر دهی", 400, "SELF_ROLE");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست نامعتبر است", 400);
  }

  const parsed = setRoleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است", 422);
  }

  await adminSetUserRole(id, parsed.data.role);
  return apiSuccess({ message: "نقش کاربر به‌روزرسانی شد" });
}
