import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Book } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq, or, ilike, desc } from "drizzle-orm";

// GET: Search books by title, author, or genre
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "توکن لازم است" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decoded.id;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ books: [], total: 0, page, limit });
    }

    const searchTerm = `%${query.trim()}%`;

    // Search in title, author, and genre
    const books = await db
      .select()
      .from(Book)
      .where(
        eq(Book.userId, userId) &&
          or(
            ilike(Book.title, searchTerm),
            ilike(Book.author, searchTerm),
            ilike(Book.genre, searchTerm)
          )
      )
      .orderBy(desc(Book.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: Book.id })
      .from(Book)
      .where(
        eq(Book.userId, userId) &&
          or(
            ilike(Book.title, searchTerm),
            ilike(Book.author, searchTerm),
            ilike(Book.genre, searchTerm)
          )
      );

    const total = totalResult.length;

    return NextResponse.json({
      books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("❌ خطا در جستجوی کتاب‌ها:", err);
    return NextResponse.json(
      { error: "خطا در جستجوی کتاب‌ها" },
      { status: 500 }
    );
  }
}

