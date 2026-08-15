import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Book, Quote } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { parseUserBookUpdate, type UserBookUpdate } from "@/lib/book/user-mutation";

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

// PUT: بروزرسانی داده‌های شخصیِ کتاب (مالک)
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

    const parsed = parseUserBookUpdate(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 422 });
    }
    const updateData: UserBookUpdate & { completedAt?: Date | null } = { ...parsed.data };

    // Keep completion metadata consistent for status changes made outside the
    // dedicated reading-progress screen as well.
    if (updateData.status === "FINISHED") {
      updateData.completedAt = book.completedAt ?? new Date();
    } else if (updateData.status) {
      updateData.completedAt = null;
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
        currentPage: Book.currentPage,
        readingUpdatedAt: Book.readingUpdatedAt,
        completedAt: Book.completedAt,
        rating: Book.rating,
        review: Book.review,
        moodTags: Book.moodTags,
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
