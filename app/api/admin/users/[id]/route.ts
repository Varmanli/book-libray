import { and, count, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { db } from "@/db";
import { Book, PersonalBookNote, PublicBookThought, User } from "@/db/schema";
import { apiError, apiSuccess } from "@/lib/api/response";
import { assertAdminApi } from "@/lib/admin/permissions";
import { adminUpdateUserSchema } from "@/lib/validations/admin";
import { isUsernameAvailable } from "@/lib/profile/service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const [[user], [books], [read], [notes], [thoughts]] = await Promise.all([
    db.select({ id: User.id, name: User.name, username: User.username, email: User.email, image: User.image, bio: User.bio, role: User.role, createdAt: User.createdAt }).from(User).where(eq(User.id, id)).limit(1),
    db.select({ value: count() }).from(Book).where(eq(Book.userId, id)),
    db.select({ value: count() }).from(Book).where(and(eq(Book.userId, id), eq(Book.status, "FINISHED"))),
    db.select({ value: count() }).from(PersonalBookNote).where(eq(PersonalBookNote.userId, id)),
    db.select({ value: count() }).from(PublicBookThought).where(eq(PublicBookThought.userId, id)),
  ]);
  if (!user) return apiError("کاربر پیدا نشد", 404, "NOT_FOUND");
  return apiSuccess({ user, activity: { books: books.value, read: read.value, notes: notes.value, thoughts: thoughts.value } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = adminUpdateUserSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است", 422);
  const input = parsed.data;
  if (input.username && !(await isUsernameAvailable(input.username, id))) return apiError("این نام کاربری قبلاً انتخاب شده است", 409, "USERNAME_TAKEN");
  try {
    const [user] = await db.update(User).set({ ...input, updatedAt: new Date() }).where(eq(User.id, id)).returning({ id: User.id });
    if (!user) return apiError("کاربر پیدا نشد", 404, "NOT_FOUND");
  } catch { return apiError("ذخیره اطلاعات ناموفق بود", 422, "UPDATE_FAILED"); }
  return apiSuccess({ message: "اطلاعات کاربر ذخیره شد" });
}
