import crypto from "crypto";

/**
 * توکن بازیابی رمز عبور.
 * - توکن خام (raw) فقط به کاربر داده می‌شود (در لینک ایمیل).
 * - در دیتابیس فقط هش SHA-256 آن ذخیره می‌شود تا اگر دیتابیس لو رفت
 *   نتوان از روی آن توکن واقعی را ساخت.
 */

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// مدت اعتبار توکن بازیابی: ۱ ساعت
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
