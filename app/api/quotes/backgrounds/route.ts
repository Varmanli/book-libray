import { NextResponse } from "next/server";
import { getManagedQuoteBackgrounds } from "@/lib/quotes/backgrounds";

export const runtime = "nodejs";

export async function GET() {
  try {
    const backgrounds = await getManagedQuoteBackgrounds(true);
    return NextResponse.json({ backgrounds });
  } catch (error) {
    console.error("[api/quotes/backgrounds] error:", error);
    return NextResponse.json(
      { error: "بارگذاری پس‌زمینه‌ها ناموفق بود." },
      { status: 500 },
    );
  }
}
