import Link from "next/link";

import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-[2rem] border border-border/80 bg-card/70 p-8 text-center shadow-[0_24px_80px_-56px_rgba(0,0,0,0.85)]">
        <p className="text-sm font-bold text-primary">404</p>
        <h1 className="mt-3 text-3xl font-black text-foreground">
          صفحه پیدا نشد
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          صفحه‌ای که دنبالش بودی در قفسه پیدا نشد. می‌توانی به کتاب‌ها برگردی یا کتاب تازه‌ای اضافه کنی.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="rounded-2xl">
            <Link href="/books">بازگشت به کتاب‌ها</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/books/add">افزودن کتاب</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
