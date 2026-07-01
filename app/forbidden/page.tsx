import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "دسترسی غیرمجاز — قفسه" };

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <h1 className="mt-5 text-2xl font-black text-foreground">دسترسی غیرمجاز</h1>
      <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
        این بخش فقط برای مدیران سامانه است. اگر فکر می‌کنی اشتباهی رخ داده، با
        مدیر تماس بگیر.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
