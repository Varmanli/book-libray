import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Wishlist } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq, desc } from "drizzle-orm";

// 📌 نوع داده ورودی برای Wishlist
interface WishlistBody {
  title: string;
  author: string;
  publisher?: string;
  genre?: string;
  translator?: string;
  note?: string;
  priority:
    | "MUST_HAVE"
    | "WANT_IT"
    | "NICE_TO_HAVE"
    | "IF_EXTRA_MONEY"
    | "NOT_IMPORTANT";
}

// 📌 ایجاد آیتم جدید در Wishlist
export async function POST(req: NextRequest) {
  try {
    // گرفتن کوکی "token"
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "توکن لاگین نیاز است" },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      userId = decoded.id;
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر است" }, { status: 401 });
    }

    const body: WishlistBody = await req.json();

    // بررسی الزامی بودن فیلدها
    if (!body.title || !body.author || !body.priority) {
      return NextResponse.json(
        { error: "عنوان، نویسنده و اولویت الزامی هستند" },
        { status: 400 }
      );
    }

    // ایجاد آیتم
    const [newWishlist] = await db
      .insert(Wishlist)
      .values({
        userId,
        title: body.title,
        author: body.author,
        publisher: body.publisher,
        genre: body.genre,
        translator: body.translator,
        note: body.note,
        priority: body.priority,
      })
      .returning();

    return NextResponse.json(
      { wishlist: newWishlist, message: "آیتم به لیست علاقه‌مندی‌ها اضافه شد" },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ خطا در ایجاد آیتم Wishlist:", err);
    return NextResponse.json({ error: "خطا در ایجاد آیتم" }, { status: 500 });
  }
}

// 📌 گرفتن لیست Wishlist کاربر
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "توکن لازم است" }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      userId = decoded.id;
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر است" }, { status: 401 });
    }

    const userWishlist = await db
      .select()
      .from(Wishlist)
      .where(eq(Wishlist.userId, userId))
      .orderBy(desc(Wishlist.createdAt));

    return NextResponse.json({ wishlist: userWishlist });
  } catch (err) {
    console.error("❌ خطا در دریافت Wishlist:", err);
    return NextResponse.json(
      { error: "خطا در دریافت لیست علاقه‌مندی‌ها" },
      { status: 500 }
    );
  }
}
