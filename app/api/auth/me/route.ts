import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { User } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };

      // Verify user still exists in database
      const [user] = await db
        .select({ id: User.id, name: User.name, email: User.email })
        .from(User)
        .where(eq(User.id, decoded.id));

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }

      return NextResponse.json({ user }, { status: 200 });
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (err) {
    console.error("❌ Error in auth/me:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
