import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Book } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq, desc } from "drizzle-orm";

// 🔹 اسکیمای داده برای ایجاد کتاب
interface BookBody {
  title: string;
  coverImage: string;
  author: string;
  translator?: string;
  description?: string;
  country?: string;
  genre: string;
  pageCount?: number;
  format: "PHYSICAL" | "ELECTRONIC";
  publisher?: string;
  status?: "UNREAD" | "READING" | "FINISHED";
  progress?: number;
}

// 📌 ایجاد کتاب جدید
export async function POST(req: NextRequest) {
  try {
    // گرفتن کوکی "token"
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json(
        { error: "توکن لاگین نیاز است" },
        { status: 401 }
      );

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      userId = decoded.id;
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر است" }, { status: 401 });
    }

    const body: BookBody = await req.json();
    if (!body.title || !body.coverImage || !body.author || !body.genre) {
      return NextResponse.json(
        { error: "اطلاعات ضروری کتاب ناقص است" },
        { status: 400 }
      );
    }

    // ایجاد کتاب با Drizzle
    const [newBook] = await db
      .insert(Book)
      .values({
        ...body,
        userId,
      })
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

    return NextResponse.json(
      { book: newBook, message: "کتاب ایجاد شد" },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ خطا در ایجاد کتاب:", err);
    return NextResponse.json({ error: "خطا در ایجاد کتاب" }, { status: 500 });
  }
}

// 📌 گرفتن لیست کتاب‌های کاربر
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "توکن لازم است" }, { status: 401 });

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      userId = decoded.id;
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر است" }, { status: 401 });
    }

    const userBooks = await db
      .select()
      .from(Book)
      .where(eq(Book.userId, userId))
      .orderBy(desc(Book.createdAt)); // ✅ استفاده از desc() برای type-safe

    const response = NextResponse.json({ Book: userBooks });

    // Cache for 1 minute
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "خطا در دریافت کتاب‌ها" },
      { status: 500 }
    );
  }
}
