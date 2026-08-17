import Link from "next/link";
import { ArrowLeft, BookOpen, Home, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[78vh] items-center justify-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[13rem] font-black leading-none tracking-[-0.08em] text-foreground/[0.025] sm:text-[20rem] lg:text-[28rem]">
          ۴۰۴
        </div>

        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <section className="relative w-full max-w-3xl">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/75 px-6 py-10 shadow-[0_35px_100px_-60px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="mx-auto max-w-xl text-center">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
              <BookOpen className="h-6 w-6" />
            </div>

            {/* 404 label */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-border" />
              <span className="text-xs font-black tracking-[0.18em] text-primary">
                ۴۰۴
              </span>
              <span className="h-px w-8 bg-border" />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              این صفحه از قفسه جا مانده
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm font-medium leading-8 text-muted-foreground sm:text-[15px]">
              صفحه‌ای که دنبالش بودی پیدا نشد. شاید آدرس تغییر کرده، حذف شده یا
              مسیر اشتباهی را باز کرده‌ای.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-2xl px-6 font-bold shadow-lg shadow-primary/10"
              >
                <Link href="/books">
                  <BookOpen className="ml-2 h-4 w-4" />
                  گشتن بین کتاب‌ها
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-2xl border-border/80 bg-background/60 px-6 font-bold"
              >
                <Link href="/">
                  <Home className="ml-2 h-4 w-4" />
                  صفحه اصلی
                </Link>
              </Button>
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="mt-10 border-t border-border/70 pt-6">
            <div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
              <p className="text-center text-xs leading-6 text-muted-foreground sm:text-right">
                کتاب موردنظرت هنوز در قفسه نیست؟
              </p>

              <Link
                href="/books/add"
                className="group inline-flex items-center gap-2 font-bold text-foreground transition-colors hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                افزودن کتاب جدید
                <ArrowLeft className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-x-1 group-hover:text-primary" />
              </Link>
            </div>
          </div>
        </div>

        {/* Tiny footer detail */}
        <p className="mt-5 text-center text-[11px] font-medium text-muted-foreground/60">
          حتی در بزرگ‌ترین کتابخانه‌ها هم گاهی یک صفحه گم می‌شود.
        </p>
      </section>
    </main>
  );
}
