import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import {
  adminRemoveFeaturedBook,
  adminSetFeaturedActive,
} from "@/lib/home/service";

const patchSchema = z.object({ isActive: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");
  if (!isAdmin(user)) return apiError("دسترسی غیرمجاز", 403, "FORBIDDEN");

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست نامعتبر است", 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("ورودی نامعتبر است", 422);

  await adminSetFeaturedActive(id, parsed.data.isActive);
  return apiSuccess({ message: "به‌روزرسانی شد" });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");
  if (!isAdmin(user)) return apiError("دسترسی غیرمجاز", 403, "FORBIDDEN");

  const { id } = await params;
  await adminRemoveFeaturedBook(id);
  return apiSuccess({ message: "حذف شد" });
}
