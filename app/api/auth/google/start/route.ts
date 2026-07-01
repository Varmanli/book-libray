import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl, createGoogleState } from "@/lib/auth/google";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_REDIRECT_COOKIE = "google_oauth_redirect";

export async function GET(req: NextRequest) {
  const state = createGoogleState();
  const redirect = req.nextUrl.searchParams.get("redirect") || "/books";
  const authUrl = buildGoogleAuthUrl({
    origin: req.nextUrl.origin,
    state,
  });

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  response.cookies.set(GOOGLE_REDIRECT_COOKIE, redirect, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
