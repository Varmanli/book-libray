import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getAdminCatalogBookForEdit, setAdminCatalogBookPrimaryEdition } from "@/lib/admin/service";
import { adminPrimaryEditionSchema } from "@/lib/validations/catalog";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const { bookId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست نامعتبر است", 400);
  }

  const parsed = adminPrimaryEditionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است", 422);
  }

  try {
    const result = await setAdminCatalogBookPrimaryEdition(bookId, parsed.data);
    const book = await getAdminCatalogBookForEdit(bookId);

    revalidatePath("/admin/books");
    revalidatePath(`/admin/books/${bookId}/edit`);
    revalidatePath("/books");
    if (book?.slug) {
      revalidatePath(`/book/${book.slug}`);
      revalidatePath(`/book/${book.slug}/notes`);
    }

    return apiSuccess({
      success: true,
      primaryEditionId: result.primaryEditionId,
      message: result.primaryEditionId ? "نسخه اصلی کتاب بروزرسانی شد" : "نسخه اصلی کتاب پاک شد",
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "CATALOG_BOOK_NOT_FOUND") {
        return apiError("کتاب پیدا نشد", 404, "CATALOG_BOOK_NOT_FOUND");
      }
      if (err.message === "EDITION_NOT_FOUND") {
        return apiError("نسخه پیدا نشد", 404, "EDITION_NOT_FOUND");
      }
      if (err.message === "EDITION_BOOK_MISMATCH") {
        return apiError("نسخه انتخاب‌شده متعلق به این کتاب نیست", 422, "EDITION_BOOK_MISMATCH");
      }
    }

    console.error("admin primary edition update failed:", err);
    return apiError("بروزرسانی نسخه اصلی ناموفق بود", 500);
  }
}
