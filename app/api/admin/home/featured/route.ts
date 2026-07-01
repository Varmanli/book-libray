import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import {
  adminAddFeaturedBook,
  adminListFeaturedBooks,
} from "@/lib/home/service";

const addSchema = z.object({ bookId: z.string().min(1, "کتاب نامعتبر است") });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");
  if (!isAdmin(user)) return apiError("دسترسی غیرمجاز", 403, "FORBIDDEN");

  const items = await adminListFeaturedBooks();
  return apiSuccess({ items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("احراز هویت نشده", 401, "UNAUTHENTICATED");
  if (!isAdmin(user)) return apiError("دسترسی غیرمجاز", 403, "FORBIDDEN");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست نامعتبر است", 400);
  }

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است", 422);
  }

  try {
    await adminAddFeaturedBook(parsed.data.bookId);
  } catch {
    return apiError("افزودن کتاب ناموفق بود", 400);
  }
  return apiSuccess({ message: "به پیشنهادها افزوده شد" }, { status: 201 });
}
