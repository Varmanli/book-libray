import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Wishlist } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

interface WishlistItemInput {
  title?: string;
  author?: string;
  publisher?: string;
  genre?: string;
  translator?: string;
  note?: string;
  priority?:
    | "MUST_HAVE"
    | "WANT_IT"
    | "NICE_TO_HAVE"
    | "IF_EXTRA_MONEY"
    | "NOT_IMPORTANT";
}

// 📌 اعتبارسنجی داده‌های ورودی برای ویرایش
function validateWishlistUpdateData(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (data.title !== undefined) {
    if (typeof data.title !== "string" || data.title.trim().length === 0) {
      errors.push("عنوان کتاب نمی‌تواند خالی باشد");
    } else if (data.title.trim().length > 255) {
      errors.push("عنوان کتاب نمی‌تواند بیش از 255 کاراکتر باشد");
    }
  }

  if (data.author !== undefined) {
    if (typeof data.author !== "string" || data.author.trim().length === 0) {
      errors.push("نام نویسنده نمی‌تواند خالی باشد");
    } else if (data.author.trim().length > 255) {
      errors.push("نام نویسنده نمی‌تواند بیش از 255 کاراکتر باشد");
    }
  }

  if (
    data.publisher !== undefined &&
    data.publisher !== null &&
    (typeof data.publisher !== "string" || data.publisher.length > 255)
  ) {
    errors.push("نام ناشر نمی‌تواند بیش از 255 کاراکتر باشد");
  }

  if (
    data.genre !== undefined &&
    data.genre !== null &&
    (typeof data.genre !== "string" || data.genre.length > 100)
  ) {
    errors.push("ژانر نمی‌تواند بیش از 100 کاراکتر باشد");
  }

  if (
    data.translator !== undefined &&
    data.translator !== null &&
    (typeof data.translator !== "string" || data.translator.length > 255)
  ) {
    errors.push("نام مترجم نمی‌تواند بیش از 255 کاراکتر باشد");
  }

  if (
    data.note !== undefined &&
    data.note !== null &&
    (typeof data.note !== "string" || data.note.length > 1000)
  ) {
    errors.push("یادداشت نمی‌تواند بیش از 1000 کاراکتر باشد");
  }

  if (data.priority !== undefined) {
    const validPriorities = [
      "MUST_HAVE",
      "WANT_IT",
      "NICE_TO_HAVE",
      "IF_EXTRA_MONEY",
      "NOT_IMPORTANT",
    ];
    if (!validPriorities.includes(data.priority)) {
      errors.push("اولویت معتبر انتخاب کنید");
    }
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

// 📌 حذف آیتم خاص
export async function DELETE(
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

    // دریافت params
    const { id } = await params;

    // اعتبارسنجی ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "شناسه آیتم نامعتبر است" },
        { status: 400 }
      );
    }

    // حذف فقط آیتمی که متعلق به کاربر است
    const [deletedItem] = await db
      .delete(Wishlist)
      .where(and(eq(Wishlist.id, id), eq(Wishlist.userId, userId)))
      .returning();

    if (!deletedItem) {
      return NextResponse.json(
        { error: "آیتم پیدا نشد یا متعلق به شما نیست" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "آیتم حذف شد",
      item: deletedItem,
    });
  } catch (err) {
    console.error("❌ خطا در حذف آیتم:", err);
    return NextResponse.json({ error: "خطا در حذف آیتم" }, { status: 500 });
  }
}

// 📌 ویرایش آیتم خاص
export async function PUT(
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

    // دریافت params
    const { id } = await params;

    // اعتبارسنجی ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "شناسه آیتم نامعتبر است" },
        { status: 400 }
      );
    }

    // دریافت و اعتبارسنجی داده‌ها
    let data: WishlistItemInput;
    try {
      data = await req.json();
    } catch {
      return NextResponse.json(
        { error: "داده‌های ارسالی نامعتبر است" },
        { status: 400 }
      );
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "هیچ داده‌ای برای ویرایش ارسال نشده" },
        { status: 400 }
      );
    }

    // اعتبارسنجی داده‌های ورودی
    const validation = validateWishlistUpdateData(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "داده‌های نامعتبر", details: validation.errors },
        { status: 400 }
      );
    }

    // آماده‌سازی داده‌ها برای به‌روزرسانی
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.author !== undefined) updateData.author = data.author.trim();
    if (data.publisher !== undefined)
      updateData.publisher = data.publisher?.trim() || null;
    if (data.genre !== undefined) updateData.genre = data.genre?.trim() || null;
    if (data.translator !== undefined)
      updateData.translator = data.translator?.trim() || null;
    if (data.note !== undefined) updateData.note = data.note?.trim() || null;
    if (data.priority !== undefined) updateData.priority = data.priority;

    const [updatedItem] = await db
      .update(Wishlist)
      .set(updateData)
      .where(and(eq(Wishlist.id, id), eq(Wishlist.userId, userId)))
      .returning();

    if (!updatedItem) {
      return NextResponse.json(
        { error: "آیتم پیدا نشد یا متعلق به شما نیست" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      item: updatedItem,
      message: "آیتم ویرایش شد",
    });
  } catch (err) {
    console.error("❌ خطا در ویرایش آیتم:", err);
    return NextResponse.json({ error: "خطا در ویرایش آیتم" }, { status: 500 });
  }
}
