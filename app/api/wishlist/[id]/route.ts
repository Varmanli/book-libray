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

// 📌 حذف آیتم خاص
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // گرفتن توکن از کوکی
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

    // حذف فقط آیتمی که متعلق به کاربر است
    const [deletedItem] = await db
      .delete(Wishlist)
      .where(and(eq(Wishlist.id, params.id), eq(Wishlist.userId, userId)))
      .returning();

    if (!deletedItem) {
      return NextResponse.json(
        { error: "آیتم پیدا نشد یا متعلق به شما نیست" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "آیتم حذف شد", item: deletedItem });
  } catch (err) {
    console.error("❌ خطا در حذف آیتم:", err);
    return NextResponse.json({ error: "خطا در حذف آیتم" }, { status: 500 });
  }
}

// 📌 ویرایش آیتم خاص
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const data: WishlistItemInput = await req.json();
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "هیچ داده‌ای برای ویرایش ارسال نشده" },
        { status: 400 }
      );
    }

    const [updatedItem] = await db
      .update(Wishlist)
      .set({ ...data })
      .where(and(eq(Wishlist.id, params.id), eq(Wishlist.userId, userId)))
      .returning();

    if (!updatedItem) {
      return NextResponse.json(
        { error: "آیتم پیدا نشد یا متعلق به شما نیست" },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: updatedItem, message: "آیتم ویرایش شد" });
  } catch (err) {
    console.error("❌ خطا در ویرایش آیتم:", err);
    return NextResponse.json({ error: "خطا در ویرایش آیتم" }, { status: 500 });
  }
}
