import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const destination = new URL("/api/auth/google", req.nextUrl.origin);
  const redirect = req.nextUrl.searchParams.get("redirect");
  if (redirect) destination.searchParams.set("redirect", redirect);
  return NextResponse.redirect(destination);
}
