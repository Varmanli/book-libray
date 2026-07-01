import { redirect } from "next/navigation";

// «قوانین» اکنون زیر اسلاگ پایدارِ /terms مدیریت می‌شود؛ مسیر قدیمی برای حفظ
// لینک‌های قبلی به آن هدایت می‌شود.
export default function RulesPage() {
  redirect("/terms");
}
