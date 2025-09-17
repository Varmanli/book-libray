import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Quote } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

// POST: Create a new quote
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "توکن لازم است" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decoded.id;

    const body = await req.json();
    const { content, page, bookId } = body;

    if (!content || !bookId) {
      return NextResponse.json(
        { error: "محتوای نقل قول و شناسه کتاب ضروری است" },
        { status: 400 }
      );
    }

    // Verify the book belongs to the user
    const { Book } = await import("@/db/schema");
    const [book] = await db.select().from(Book).where(eq(Book.id, bookId));

    if (!book) {
      return NextResponse.json({ error: "کتاب پیدا نشد" }, { status: 404 });
    }

    if (book.userId !== userId) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const [newQuote] = await db
      .insert(Quote)
      .values({
        content,
        page: page || null,
        bookId,
      })
      .returning();

    return NextResponse.json({
      quote: newQuote,
      message: "نقل قول با موفقیت اضافه شد",
    });
  } catch (err) {
    console.error("❌ خطا در ایجاد نقل قول:", err);
    return NextResponse.json(
      { error: "خطا در ایجاد نقل قول" },
      { status: 500 }
    );
  }
}
