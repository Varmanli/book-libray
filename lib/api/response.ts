import { NextResponse } from "next/server";

/**
 * پاسخ‌های API را یکدست نگه می‌دارد.
 * موفق:  { ok: true, ...data }
 * خطا:   { ok: false, error: string, code?: string }
 */

export function apiSuccess<T extends Record<string, unknown>>(
  data: T = {} as T,
  init?: ResponseInit
): NextResponse {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function apiError(
  message: string,
  status = 400,
  code?: string
): NextResponse {
  return NextResponse.json(
    { ok: false, error: message, ...(code ? { code } : {}) },
    { status }
  );
}
