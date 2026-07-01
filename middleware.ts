import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth/constants";

/**
 * بررسی سبک در لبه (edge): فقط وجود کوکی توکن را چک می‌کند.
 * اعتبارسنجی واقعی امضای JWT در layout داشبورد (محیط Node) انجام می‌شود،
 * چون kتابخانه‌ی jsonwebtoken در رانتایم edge اجرا نمی‌شود.
 */

// Note: `/book/[id]` is intentionally PUBLIC (logged-out users see it with a
// login CTA), so it is not listed here.
const PROTECTED_PREFIXES = ["/books", "/wishlist", "/account"];
const AUTH_PAGES = ["/auth/login", "/auth/signup", "/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasToken = Boolean(req.cookies.get(AUTH_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);

  // کاربر احرازنشده‌ای که سراغ صفحه‌ی محافظت‌شده می‌رود → ورود
  if (isProtected && !hasToken) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // کاربر واردشده‌ای که سراغ صفحات ورود/ثبت‌نام می‌رود → کتابخانه
  if (isAuthPage && hasToken) {
    return NextResponse.redirect(new URL("/books", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/books/:path*",
    "/wishlist/:path*",
    "/account/:path*",
    "/auth/:path*",
    "/login",
  ],
};
