import { NextRequest, NextResponse } from "next/server";
import { resolveInternalRedirect } from "@/lib/auth/redirects";

export async function GET(req: NextRequest) {
  const destination = resolveInternalRedirect("/api/auth/google");
  const redirect = req.nextUrl.searchParams.get("redirect");
  if (redirect) destination.searchParams.set("redirect", redirect);
  return NextResponse.redirect(destination);
}
