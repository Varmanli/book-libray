import { NextResponse } from "next/server";
import { db } from "@/db";
import { User } from "@/db/schema";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/jwt";
import { serialize } from "cookie";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "ایمیل و پسورد لازم است" },
        { status: 400 }
      );
    }

    // جستجوی کاربر با Drizzle
    const [user] = await db.select().from(User).where(eq(User.email, email));

    if (!user || !user.password) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "پسورد اشتباه است" }, { status: 401 });
    }

    // ساخت JWT
    const token = signJwt({ id: user.id });

    // ست کردن کوکی HTTPOnly
    const cookieSerialized = serialize("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 روز
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json(
      { message: "ورود موفق" },
      { headers: { "Set-Cookie": cookieSerialized } }
    );
  } catch (err) {
    console.error("❌ خطا در Login:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
