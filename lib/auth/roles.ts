/**
 * تشخیص ادمین: یا نقش کاربر ADMIN است، یا ایمیلش در ADMIN_EMAILS تعریف شده
 * (برای راه‌اندازی اولین ادمین بدون ویرایش مستقیم دیتابیس).
 */
export function isAdmin(
  user: { role?: string | null; email?: string | null } | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;

  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return !!user.email && allow.includes(user.email.toLowerCase());
}
