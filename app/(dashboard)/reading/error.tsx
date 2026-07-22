"use client";

import { Button } from "@/components/ui/button";

export default function ReadingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 md:pt-10">
      <section className="rounded-3xl border border-destructive/20 bg-card/60 p-8 text-center">
        <h1 className="text-lg font-bold text-foreground">قفسه‌ی در حال مطالعه بارگذاری نشد</h1>
        <p className="mt-2 text-sm text-muted-foreground">لطفاً دوباره تلاش کن.</p>
        <Button className="mt-5 rounded-xl" onClick={reset}>تلاش دوباره</Button>
      </section>
    </main>
  );
}
