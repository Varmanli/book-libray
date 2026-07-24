import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { Quote, QuoteBackground } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { normalizeMediaUrl } from "@/lib/book/cover";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const rows = await db
      .select({
        id: QuoteBackground.id,
        value: QuoteBackground.value,
        label: QuoteBackground.label,
        imageKey: QuoteBackground.imageKey,
        imageUrl: QuoteBackground.imageUrl,
        isActive: QuoteBackground.isActive,
        displayOrder: QuoteBackground.displayOrder,
        isSystem: QuoteBackground.isSystem,
        createdAt: QuoteBackground.createdAt,
        updatedAt: QuoteBackground.updatedAt,
        quoteCount: sql<number>`count(${Quote.id})::int`,
      })
      .from(QuoteBackground)
      .leftJoin(Quote, eq(Quote.background, QuoteBackground.value))
      .groupBy(QuoteBackground.id)
      .orderBy(asc(QuoteBackground.displayOrder), asc(QuoteBackground.createdAt));

    const backgrounds = rows.map((r) => ({
      ...r,
      image: r.imageUrl || (r.imageKey ? normalizeMediaUrl(r.imageKey) : null),
    }));

    return NextResponse.json({ backgrounds });
  } catch (error) {
    console.error("[GET /api/admin/quote-backgrounds] error:", error);
    return NextResponse.json(
      { error: "دریافت پس‌زمینه‌ها ناموفق بود." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      label?: string;
      imageKey?: string | null;
      imageUrl?: string | null;
      isActive?: boolean;
      displayOrder?: number;
    } | null;

    const label = body?.label?.trim() || "";
    const imageKey = typeof body?.imageKey === "string" ? body.imageKey.trim() : null;
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : null;
    const isActive = body?.isActive ?? true;
    const displayOrder = typeof body?.displayOrder === "number" ? body.displayOrder : 0;

    if (!label) {
      return NextResponse.json(
        { error: "عنوان پس‌زمینه الزامی است." },
        { status: 400 },
      );
    }

    if (!imageKey && !imageUrl) {
      return NextResponse.json(
        { error: "انتخاب تصویر برای پس‌زمینه الزامی است." },
        { status: 400 },
      );
    }

    // Generate unique value identifier
    const value = `bg-custom-${Date.now()}`;

    const [created] = await db
      .insert(QuoteBackground)
      .values({
        value,
        label,
        imageKey,
        imageUrl,
        isActive,
        displayOrder,
        isSystem: false,
      })
      .returning();

    return NextResponse.json({
      background: {
        ...created,
        image: created.imageUrl || (created.imageKey ? normalizeMediaUrl(created.imageKey) : null),
      },
      message: "پس‌زمینه با موفقیت ایجاد شد.",
    });
  } catch (error) {
    console.error("[POST /api/admin/quote-backgrounds] error:", error);
    return NextResponse.json(
      { error: "ایجاد پس‌زمینه ناموفق بود." },
      { status: 500 },
    );
  }
}
