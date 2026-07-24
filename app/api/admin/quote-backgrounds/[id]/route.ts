import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { Quote, QuoteBackground } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { normalizeMediaUrl } from "@/lib/book/cover";
import { deleteImageUpload } from "@/lib/server/upload-storage";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const [existing] = await db
      .select()
      .from(QuoteBackground)
      .where(eq(QuoteBackground.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "پس‌زمینه موردنظر پیدا نشد." },
        { status: 404 },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      label?: string;
      imageKey?: string | null;
      imageUrl?: string | null;
      isActive?: boolean;
      displayOrder?: number;
    } | null;

    const label = body?.label?.trim() || existing.label;
    let imageKey = typeof body?.imageKey === "string" ? body.imageKey.trim() : existing.imageKey;
    let imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : existing.imageUrl;
    let isActive = body?.isActive ?? existing.isActive;
    const displayOrder = typeof body?.displayOrder === "number" ? body.displayOrder : existing.displayOrder;

    // Special rule for "default" non-image background
    if (existing.value === "default") {
      isActive = true;
      imageKey = null;
      imageUrl = null;
    } else {
      // If client explicitly passed empty image strings
      if (body?.imageKey === null) imageKey = null;
      if (body?.imageUrl === null) imageUrl = null;

      if (!imageKey && !imageUrl) {
        return NextResponse.json(
          { error: "تصویر پس‌زمینه نمی‌تواند خالی باشد." },
          { status: 400 },
        );
      }
    }

    const oldImageKey = existing.imageKey;

    const [updated] = await db
      .update(QuoteBackground)
      .set({
        label,
        imageKey,
        imageUrl,
        isActive,
        displayOrder,
        updatedAt: new Date(),
      })
      .where(eq(QuoteBackground.id, id))
      .returning();

    // If image key was changed/replaced and old imageKey is no longer used, cleanup asynchronously
    if (oldImageKey && oldImageKey !== imageKey) {
      deleteImageUpload(oldImageKey).catch((err) =>
        console.error("[PUT /api/admin/quote-backgrounds] failed cleanup old image:", err),
      );
    }

    return NextResponse.json({
      background: {
        ...updated,
        image: updated.imageUrl || (updated.imageKey ? normalizeMediaUrl(updated.imageKey) : null),
      },
      message: "ویرایش پس‌زمینه با موفقیت انجام شد.",
    });
  } catch (error) {
    console.error("[PUT /api/admin/quote-backgrounds/[id]] error:", error);
    return NextResponse.json(
      { error: "ویرایش پس‌زمینه ناموفق بود." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const [existing] = await db
      .select()
      .from(QuoteBackground)
      .where(eq(QuoteBackground.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "پس‌زمینه موردنظر پیدا نشد." },
        { status: 404 },
      );
    }

    if (existing.value === "default") {
      return NextResponse.json(
        { error: "پس‌زمینه پیش‌فرض سیستم قابل حذف نیست." },
        { status: 400 },
      );
    }

    // Check if any Quote references this background value
    const [quoteCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(Quote)
      .where(eq(Quote.background, existing.value));

    const count = quoteCountRow?.count || 0;

    if (count > 0) {
      return NextResponse.json(
        {
          error: `این پس‌زمینه در ${count.toLocaleString("fa-IR")} تکه‌کتاب استفاده شده است و قابل حذف نیست. می‌توانید آن را غیرفعال کنید.`,
        },
        { status: 400 },
      );
    }

    await db.delete(QuoteBackground).where(eq(QuoteBackground.id, id));

    if (existing.imageKey) {
      deleteImageUpload(existing.imageKey).catch((err) =>
        console.error("[DELETE /api/admin/quote-backgrounds] image cleanup error:", err),
      );
    }

    return NextResponse.json({ ok: true, message: "پس‌زمینه با موفقیت حذف شد." });
  } catch (error) {
    console.error("[DELETE /api/admin/quote-backgrounds/[id]] error:", error);
    return NextResponse.json(
      { error: "حذف پس‌زمینه ناموفق بود." },
      { status: 500 },
    );
  }
}
