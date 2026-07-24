import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { QuoteBackground } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      items?: Array<{ id: string; displayOrder: number }>;
    } | null;

    if (!Array.isArray(body?.items)) {
      return NextResponse.json(
        { error: "اطلاعات ترتیب معتبر نیست." },
        { status: 400 },
      );
    }

    for (const item of body.items) {
      if (typeof item.id === "string" && typeof item.displayOrder === "number") {
        await db
          .update(QuoteBackground)
          .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
          .where(eq(QuoteBackground.id, item.id));
      }
    }

    return NextResponse.json({ ok: true, message: "ترتیب پس‌زمینه‌ها بروزرسانی شد." });
  } catch (error) {
    console.error("[POST /api/admin/quote-backgrounds/reorder] error:", error);
    return NextResponse.json(
      { error: "بروزرسانی ترتیب ناموفق بود." },
      { status: 500 },
    );
  }
}
