import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Helper برای گرفتن ID از مسیر
function getIdFromUrl(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");
  return parts[parts.length - 1]; // آخرین بخش مسیر یعنی ID
}

// GET: گرفتن جزئیات یک کتاب
export async function GET(req: NextRequest) {
  try {
    const id = getIdFromUrl(req);
    const book = await prisma.book.findUnique({
      where: { id: Number(id) },
    });

    if (!book) {
      return NextResponse.json({ error: "کتاب پیدا نشد" }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (err) {
    console.error("❌ خطا در دریافت کتاب:", err);
    return NextResponse.json({ error: "خطا در دریافت کتاب" }, { status: 500 });
  }
}

// PUT: بروزرسانی کتاب (فقط مالک)
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
    const book = await prisma.book.findUnique({ where: { id: Number(id) } });

    if (!book)
      return NextResponse.json({ error: "کتاب پیدا نشد" }, { status: 404 });
    if (book.userId !== userId)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const body = await req.json();
    const updatedBook = await prisma.book.update({
      where: { id: Number(id) },
      data: body,
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
    const book = await prisma.book.findUnique({ where: { id: Number(id) } });

    if (!book)
      return NextResponse.json({ error: "کتاب پیدا نشد" }, { status: 404 });
    if (book.userId !== userId)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    await prisma.book.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "کتاب با موفقیت حذف شد" });
  } catch (err) {
    console.error("❌ خطا در حذف کتاب:", err);
    return NextResponse.json({ error: "خطا در حذف کتاب" }, { status: 500 });
  }
}
