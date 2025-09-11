import {prisma} from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
}

// 📌 ایجاد کتاب جدید
export async function POST(req: NextRequest) {
  try {
    // ✅ گرفتن کوکی "token"
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

    const newBook = await prisma.book.create({
      data: { ...body, userId },
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

    const books = await prisma.book.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ books });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "خطا در دریافت کتاب‌ها" },
      { status: 500 }
    );
  }
}
