import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth/cookies";
import { findOrCreateGoogleUser, createAuthTokenForUser } from "@/lib/auth/service";
import { exchangeGoogleCode } from "@/lib/auth/google";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_REDIRECT_COOKIE = "google_oauth_redirect";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");
  const code = req.nextUrl.searchParams.get("code");
  const storedState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const redirect = req.cookies.get(GOOGLE_REDIRECT_COOKIE)?.value || "/books";

  if (!state || !code || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/auth/login?google_error=1", req.nextUrl.origin)
    );
  }

  try {
    const googleUser = await exchangeGoogleCode({
      origin: req.nextUrl.origin,
      code,
    });

    const user = await findOrCreateGoogleUser(googleUser);
    const token = await createAuthTokenForUser(user.id);
    const response = NextResponse.redirect(new URL(redirect, req.nextUrl.origin));
    setAuthCookie(response, token, true);
    response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(GOOGLE_REDIRECT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("❌ google callback error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?google_error=1", req.nextUrl.origin)
    );
  }
}
