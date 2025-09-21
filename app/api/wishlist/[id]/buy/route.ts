import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Wishlist, Book } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";

// 📌 استخراج و اعتبارسنجی توکن
function extractAndValidateToken(
  req: NextRequest
): { userId: string } | { error: string; status: number } {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return { error: "توکن لاگین نیاز است", status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    return { userId: decoded.id };
  } catch {
    return { error: "توکن نامعتبر است", status: 401 };
  }
}

// 📌 خرید کتاب از Wishlist و اضافه کردن به Owned Books
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // اعتبارسنجی توکن
    const tokenValidation = extractAndValidateToken(req);
    if ("error" in tokenValidation) {
      return NextResponse.json(
        { error: tokenValidation.error },
        { status: tokenValidation.status }
      );
    }
    const { userId } = tokenValidation;

    const { id: wishlistId } = await params;

    // دریافت آیتم از Wishlist
    const wishlistItem = await db
      .select()
      .from(Wishlist)
      .where(and(eq(Wishlist.id, wishlistId), eq(Wishlist.userId, userId)))
      .limit(1);

    if (wishlistItem.length === 0) {
      return NextResponse.json(
        { error: "آیتم مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    const item = wishlistItem[0];

    // ایجاد کتاب جدید در Owned Books
    const [newBook] = await db
      .insert(Book)
      .values({
        title: item.title,
        author: item.author,
        translator: item.translator,
        publisher: item.publisher,
        genre: item.genre || "نامشخص",
        country: null,
        description: item.note || null,
        pageCount: null,
        format: "PHYSICAL", // Default format
        coverImage: "/placeholder-book.jpg", // Default placeholder
        userId: userId,
        status: "UNREAD",
        progress: 0,
        rating: null,
        review: null,
      })
      .returning();

    // حذف آیتم از Wishlist
    await db.delete(Wishlist).where(eq(Wishlist.id, wishlistId));

    return NextResponse.json(
      {
        book: newBook,
        message: "کتاب با موفقیت به کتابخانه اضافه شد",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ خطا در خرید کتاب:", err);
    return NextResponse.json({ error: "خطا در خرید کتاب" }, { status: 500 });
  }
}
