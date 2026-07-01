import { NextRequest } from "next/server";

/**
 * محدودکننده‌ی نرخ ساده و درون‌حافظه‌ای (fixed window) برای مسیرهای احراز هویت.
 *
 * TODO(production): این پیاده‌سازی فقط روی یک نمونه‌ی سرور کار می‌کند و با ری‌استارت
 * پاک می‌شود. برای محیط تولیدی با چند نمونه/سرورلس باید با یک استور مشترک مثل
 * Redis یا Upstash Ratelimit جایگزین شود.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** کلید محدودسازی را از روی IP درخواست و نام مسیر می‌سازد. */
export function getClientKey(req: NextRequest, scope: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

// به‌مرور سطل‌های منقضی‌شده را پاک می‌کند تا حافظه رشد بی‌رویه نکند.
function sweep() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
if (typeof setInterval !== "undefined") {
  const timer = setInterval(sweep, 5 * 60_000);
  // مانع از زنده نگه‌داشتن پروسه می‌شود (در محیط Node)
  if (typeof timer === "object" && "unref" in timer) timer.unref();
}
