import { NextRequest, NextResponse } from "next/server";

import {
  buildGoogleAuthUrl,
  createGoogleState,
  getGoogleRedirectUri,
  isGoogleOAuthDebugEnabled,
  redactGoogleAuthorizationUrl,
} from "@/lib/auth/google";
import { getPublicAppOriginSource } from "@/lib/auth/redirects";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_REDIRECT_COOKIE = "google_oauth_redirect";
const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 10 * 60,
};

/** Starts Google OAuth without accepting external post-login redirect URLs. */
export async function GET(req: NextRequest) {
  const state = createGoogleState();
  const redirect = req.nextUrl.searchParams.get("redirect") || "/books";
  const authUrl = buildGoogleAuthUrl({ state });
  if (isGoogleOAuthDebugEnabled()) {
    console.info("[auth] Google OAuth start", {
      environment: process.env.NODE_ENV,
      publicOriginSource: getPublicAppOriginSource(),
      redirectUri: getGoogleRedirectUri(),
      authorizationUrl: redactGoogleAuthorizationUrl(authUrl),
    });
  }
  const response = NextResponse.redirect(authUrl);

  response.cookies.set(GOOGLE_STATE_COOKIE, state, OAUTH_COOKIE_OPTIONS);
  response.cookies.set(GOOGLE_REDIRECT_COOKIE, redirect, OAUTH_COOKIE_OPTIONS);
  return response;
}
