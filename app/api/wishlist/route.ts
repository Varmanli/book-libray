import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Wishlist } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq, desc, asc } from "drizzle-orm";

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

// 📌 اعتبارسنجی داده‌های ورودی
function validateWishlistData(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (
    !data.title ||
    typeof data.title !== "string" ||
    data.title.trim().length === 0
  ) {
    errors.push("عنوان کتاب الزامی است");
  } else if (data.title.trim().length > 255) {
    errors.push("عنوان کتاب نمی‌تواند بیش از 255 کاراکتر باشد");
  }

  if (
    !data.author ||
    typeof data.author !== "string" ||
    data.author.trim().length === 0
  ) {
    errors.push("نام نویسنده الزامی است");
  } else if (data.author.trim().length > 255) {
    errors.push("نام نویسنده نمی‌تواند بیش از 255 کاراکتر باشد");
  }

  if (
    data.publisher &&
    (typeof data.publisher !== "string" || data.publisher.length > 255)
  ) {
    errors.push("نام ناشر نمی‌تواند بیش از 255 کاراکتر باشد");
  }

  if (
    data.genre &&
    (typeof data.genre !== "string" || data.genre.length > 100)
  ) {
    errors.push("ژانر نمی‌تواند بیش از 100 کاراکتر باشد");
  }

  if (
    data.translator &&
    (typeof data.translator !== "string" || data.translator.length > 255)
  ) {
    errors.push("نام مترجم نمی‌تواند بیش از 255 کاراکتر باشد");
  }

  if (data.note && (typeof data.note !== "string" || data.note.length > 1000)) {
    errors.push("یادداشت نمی‌تواند بیش از 1000 کاراکتر باشد");
  }

  const validPriorities = [
    "MUST_HAVE",
    "WANT_IT",
    "NICE_TO_HAVE",
    "IF_EXTRA_MONEY",
    "NOT_IMPORTANT",
  ];
  if (!data.priority || !validPriorities.includes(data.priority)) {
    errors.push("اولویت معتبر انتخاب کنید");
  }

  return { isValid: errors.length === 0, errors };
}

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

// 📌 ایجاد آیتم جدید در Wishlist
export async function POST(req: NextRequest) {
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

    // دریافت و اعتبارسنجی داده‌ها
    let body: WishlistBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "داده‌های ارسالی نامعتبر است" },
        { status: 400 }
      );
    }

    // اعتبارسنجی کامل داده‌ها
    const validation = validateWishlistData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "داده‌های نامعتبر", details: validation.errors },
        { status: 400 }
      );
    }

    // ایجاد آیتم
    const [newWishlist] = await db
      .insert(Wishlist)
      .values({
        userId,
        title: body.title.trim(),
        author: body.author.trim(),
        publisher: body.publisher?.trim() || null,
        genre: body.genre?.trim() || null,
        translator: body.translator?.trim() || null,
        note: body.note?.trim() || null,
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
    // اعتبارسنجی توکن
    const tokenValidation = extractAndValidateToken(req);
    if ("error" in tokenValidation) {
      return NextResponse.json(
        { error: tokenValidation.error },
        { status: tokenValidation.status }
      );
    }
    const { userId } = tokenValidation;

    // دریافت پارامترهای مرتب‌سازی از URL
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // تعیین ستون و جهت مرتب‌سازی
    let orderBy;
    switch (sortBy) {
      case "title":
        orderBy =
          sortOrder === "asc" ? asc(Wishlist.title) : desc(Wishlist.title);
        break;
      case "author":
        orderBy =
          sortOrder === "asc" ? asc(Wishlist.author) : desc(Wishlist.author);
        break;
      case "publisher":
        orderBy =
          sortOrder === "asc"
            ? asc(Wishlist.publisher)
            : desc(Wishlist.publisher);
        break;
      case "genre":
        orderBy =
          sortOrder === "asc" ? asc(Wishlist.genre) : desc(Wishlist.genre);
        break;
      case "priority":
        orderBy =
          sortOrder === "asc"
            ? asc(Wishlist.priority)
            : desc(Wishlist.priority);
        break;
      case "createdAt":
      default:
        orderBy =
          sortOrder === "asc"
            ? asc(Wishlist.createdAt)
            : desc(Wishlist.createdAt);
        break;
    }

    const userWishlist = await db
      .select()
      .from(Wishlist)
      .where(eq(Wishlist.userId, userId))
      .orderBy(orderBy);

    return NextResponse.json({
      wishlist: userWishlist,
      total: userWishlist.length,
      sortBy,
      sortOrder,
    });
  } catch (err) {
    console.error("❌ خطا در دریافت Wishlist:", err);
    return NextResponse.json(
      { error: "خطا در دریافت لیست علاقه‌مندی‌ها" },
      { status: 500 }
    );
  }
}
