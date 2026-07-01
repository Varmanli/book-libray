import Link from "next/link";
import { ArrowLeft, BookPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * نوار فراخوان پایانی صفحه‌ی اصلی. برای مهمان‌ها به ثبت‌نام/ورود و برای اعضا به
 * کتابخانه/افزودن کتاب هدایت می‌کند.
 */
export default function HomeCTA({
  isLoggedIn,
  libraryHref,
}: {
  isLoggedIn: boolean;
  libraryHref: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(128,167,150,0.18),transparent_55%),linear-gradient(135deg,rgba(43,98,82,0.08),transparent_60%)]" />

      <div className="relative mx-auto max-w-2xl">
        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {isLoggedIn
            ? "به مطالعه‌ات ادامه بده"
            : "قفسه‌ی کتاب‌هایت را همین حالا بساز"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
          {isLoggedIn
            ? "کتاب تازه‌ای اضافه کن، وضعیت خواندنت را به‌روز کن و تکه‌های ماندگار را ثبت کن."
            : "کتاب‌هایت را ثبت کن، مسیر مطالعه‌ات را دنبال کن و تکه‌های مورد علاقه‌ات را نگه دار."}
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {isLoggedIn ? (
            <>
              <Button asChild className="h-11 gap-2 rounded-xl px-6 font-semibold">
                <Link href="/books/add">
                  <BookPlus className="h-4 w-4" />
                  افزودن کتاب
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 gap-2 rounded-xl px-6 font-medium"
              >
                <Link href={libraryHref}>
                  کتابخانه من
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="h-11 gap-2 rounded-xl px-6 font-semibold">
                <Link href="/auth/signup">
                  ساخت حساب رایگان
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl px-6 font-medium"
              >
                <Link href="/auth/login">ورود</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
