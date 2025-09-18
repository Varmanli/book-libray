import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Book, Quote } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

// Helper برای گرفتن ID از مسیر
function getIdFromUrl(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");
  return parts[parts.length - 1];
}

// GET: گرفتن جزئیات یک کتاب
export async function GET(req: NextRequest) {
  try {
    const id = getIdFromUrl(req);

    const [book] = await db.select().from(Book).where(eq(Book.id, id));

    if (!book) {
      return NextResponse.json({ error: "کتاب پیدا نشد" }, { status: 404 });
    }

    // Get quotes for this book
    const quotes = await db
      .select()
      .from(Quote)
      .where(eq(Quote.bookId, id))
      .orderBy(Quote.id);

    return NextResponse.json({
      book: {
        ...book,
        quotes: quotes,
      },
    });
  } catch (err) {
    console.error("❌ خطا در دریافت کتاب:", err);
    return NextResponse.json({ error: "خطا در دریافت کتاب" }, { status: 500 });
  }
}

// PUT: بروزرسانی کتاب (مالک)
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "توکن لازم است" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decoded.id;

    const id = getIdFromUrl(req);

    const [book] = await db.select().from(Book).where(eq(Book.id, id));
    if (!book)
      return NextResponse.json({ error: "کتاب پیدا نشد" }, { status: 404 });
    if (book.userId !== userId)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const body = await req.json();

    // ✅ فیلتر کردن undefined ها
    const updateData: Record<string, any> = {};
    for (const key of Object.keys(body)) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "هیچ مقداری برای بروزرسانی ارسال نشده" },
        { status: 400 }
      );
    }

    const [updatedBook] = await db
      .update(Book)
      .set(updateData)
      .where(eq(Book.id, id))
      .returning({
        id: Book.id,
        title: Book.title,
        author: Book.author,
        genre: Book.genre,
        userId: Book.userId,
        createdAt: Book.createdAt,
        coverImage: Book.coverImage,
        translator: Book.translator,
        description: Book.description,
        country: Book.country,
        pageCount: Book.pageCount,
        format: Book.format,
        publisher: Book.publisher,
        status: Book.status,
        progress: Book.progress,
        rating: Book.rating,
        review: Book.review,
      });

    return NextResponse.json({
      book: updatedBook,
      message: "کتاب بروزرسانی شد",
    });
  } catch (err) {
    console.error("❌ خطا در بروزرسانی کتاب:", err);
    return NextResponse.json(
      { error: "خطا در بروزرسانی کتاب" },
      { status: 500 }
    );
  }
}

// DELETE: حذف کتاب (فقط مالک)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "توکن لازم است" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decoded.id;

    const id = getIdFromUrl(req);

    const [book] = await db.select().from(Book).where(eq(Book.id, id));
    if (!book)
      return NextResponse.json({ error: "کتاب پیدا نشد" }, { status: 404 });
    if (book.userId !== userId)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    await db.delete(Book).where(eq(Book.id, id));

    return NextResponse.json({ message: "کتاب با موفقیت حذف شد" });
  } catch (err) {
    console.error("❌ خطا در حذف کتاب:", err);
    return NextResponse.json({ error: "خطا در حذف کتاب" }, { status: 500 });
  }
}
