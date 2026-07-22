import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { setAuthCookie } from "@/lib/auth/cookies";
import { findOrCreateGoogleUser, createAuthTokenForUser } from "@/lib/auth/service";
import { exchangeGoogleCode } from "@/lib/auth/google";
import { isGoogleOAuthDebugEnabled } from "@/lib/auth/google";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_REDIRECT_COOKIE = "google_oauth_redirect";

function statesMatch(state: string, storedState: string) {
  const stateBuffer = Buffer.from(state);
  const storedStateBuffer = Buffer.from(storedState);
  return (
    stateBuffer.length === storedStateBuffer.length &&
    crypto.timingSafeEqual(stateBuffer, storedStateBuffer)
  );
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(GOOGLE_REDIRECT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");
  const code = req.nextUrl.searchParams.get("code");
  const storedState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const redirect = req.cookies.get(GOOGLE_REDIRECT_COOKIE)?.value || "/books";

  if (isGoogleOAuthDebugEnabled()) {
    console.info("[auth] Google OAuth callback", {
      environment: process.env.NODE_ENV,
      callbackUrl: `${req.nextUrl.origin}${req.nextUrl.pathname}`,
      hasCode: Boolean(code),
      hasState: Boolean(state),
    });
  }

  if (!state || !code || !storedState || !statesMatch(state, storedState)) {
    return clearOAuthCookies(NextResponse.redirect(
      new URL("/auth/login?google_error=1", req.nextUrl.origin)
    ));
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
    return clearOAuthCookies(response);
  } catch {
    console.error("[auth] Google OAuth callback failed.");
    return clearOAuthCookies(NextResponse.redirect(
      new URL("/auth/login?google_error=1", req.nextUrl.origin)
    ));
  }
}
