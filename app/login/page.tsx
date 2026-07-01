import { redirect } from "next/navigation";

// صفحه‌ی ورود به مسیر جدید /auth/login منتقل شده است.
export default function LegacyLoginRedirect() {
  redirect("/auth/login");
}
