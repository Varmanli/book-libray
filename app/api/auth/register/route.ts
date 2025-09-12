import { NextResponse } from "next/server";
import { db } from "@/db"; // اتصال Drizzle
import { User } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "ایمیل و پسورد لازم است" },
        { status: 400 }
      );
    }

    // بررسی اینکه کاربر قبلا وجود داشته باشه
    const [existingUser] = await db
      .select()
      .from(User)
      .where(eq(User.email, email));

    if (existingUser) {
      return NextResponse.json(
        { error: "کاربر با این ایمیل وجود دارد" },
        { status: 400 }
      );
    }

    // هش کردن پسورد
    const hashedPassword = await bcrypt.hash(password, 10);

    // ایجاد کاربر جدید
    const [user] = await db
      .insert(User)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning({ id: User.id, email: User.email, name: User.name });

    return NextResponse.json({
      message: "ثبت‌نام موفق",
      user,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
