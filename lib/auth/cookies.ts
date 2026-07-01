import { NextResponse } from "next/server";
import { AUTH_COOKIE, TOKEN_TTL_SECONDS } from "@/lib/auth/constants";

export { AUTH_COOKIE };

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setAuthCookie(
  res: NextResponse,
  token: string,
  rememberMe = false
): void {
  res.cookies.set(AUTH_COOKIE, token, {
    ...baseCookieOptions,
    ...(rememberMe ? { maxAge: TOKEN_TTL_SECONDS } : {}),
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}
