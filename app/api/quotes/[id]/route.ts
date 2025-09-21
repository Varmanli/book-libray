import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Quote, Book } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

// Helper to get ID from URL
function getIdFromUrl(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");
  return parts[parts.length - 1];
}

// GET: Get a specific quote
export async function GET(req: NextRequest) {
  try {
    const id = getIdFromUrl(req);

    const [quote] = await db.select().from(Quote).where(eq(Quote.id, id));

    if (!quote) {
      return NextResponse.json({ error: "نقل قول پیدا نشد" }, { status: 404 });
    }

    return NextResponse.json({ quote });
  } catch (err) {
    console.error("❌ خطا در دریافت نقل قول:", err);
    return NextResponse.json(
      { error: "خطا در دریافت نقل قول" },
      { status: 500 }
    );
  }
}

// PUT: Update a quote
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "توکن لازم است" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decoded.id;

    const id = getIdFromUrl(req);
    const body = await req.json();
    const { content, page } = body;

    if (!content) {
      return NextResponse.json(
        { error: "محتوای نقل قول ضروری است" },
        { status: 400 }
      );
    }

    // Get the quote and verify ownership through book
    const [quote] = await db
      .select({
        quote: Quote,
        book: Book,
      })
      .from(Quote)
      .innerJoin(Book, eq(Quote.bookId, Book.id))
      .where(eq(Quote.id, id));

    if (!quote) {
      return NextResponse.json({ error: "نقل قول پیدا نشد" }, { status: 404 });
    }

    if (quote.book.userId !== userId) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const [updatedQuote] = await db
      .update(Quote)
      .set({
        content,
        page: page || null,
      })
      .where(eq(Quote.id, id))
      .returning();

    return NextResponse.json({
      quote: updatedQuote,
      message: "نقل قول با موفقیت بروزرسانی شد",
    });
  } catch (err) {
    console.error("❌ خطا در بروزرسانی نقل قول:", err);
    return NextResponse.json(
      { error: "خطا در بروزرسانی نقل قول" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a quote
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "توکن لازم است" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decoded.id;

    const id = getIdFromUrl(req);

    // Get the quote and verify ownership through book
    const [quote] = await db
      .select({
        quote: Quote,
        book: Book,
      })
      .from(Quote)
      .innerJoin(Book, eq(Quote.bookId, Book.id))
      .where(eq(Quote.id, id));

    if (!quote) {
      return NextResponse.json({ error: "نقل قول پیدا نشد" }, { status: 404 });
    }

    if (quote.book.userId !== userId) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    await db.delete(Quote).where(eq(Quote.id, id));

    return NextResponse.json({ message: "نقل قول با موفقیت حذف شد" });
  } catch (err) {
    console.error("❌ خطا در حذف نقل قول:", err);
    return NextResponse.json({ error: "خطا در حذف نقل قول" }, { status: 500 });
  }
}








