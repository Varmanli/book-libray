"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import { ReadingManagementModal, readingPercent, type ReadingBook } from "@/components/books/CurrentlyReadingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CurrentlyReadingBook } from "@/lib/reading/service";

function relativeTime(value: Date | string | null) {
  if (!value) return "هنوز ثبت نشده";
  const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  const hours = Math.round(minutes / 60); const days = Math.round(hours / 24);
  const formatter = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });
  if (Math.abs(days) >= 1) return formatter.format(days, "day");
  if (Math.abs(hours) >= 1) return formatter.format(hours, "hour");
  if (Math.abs(minutes) >= 1) return formatter.format(minutes, "minute");
  return "همین حالا";
}

export default function CurrentlyReadingPage({ initialBooks, libraryHref }: { initialBooks: CurrentlyReadingBook[]; libraryHref: string }) {
  const [books, setBooks] = useState(initialBooks);
  const [query, setQuery] = useState("");
  const visibleBooks = useMemo(() => { const term = query.trim().toLocaleLowerCase("fa-IR"); return !term ? books : books.filter((book) => `${book.title} ${book.author}`.toLocaleLowerCase("fa-IR").includes(term)); }, [books, query]);
  const updateBook = (id: string, next: Partial<ReadingBook> & { status?: string }) => setBooks((current) => next.status && next.status !== "READING" ? current.filter((book) => book.id !== id) : current.map((book) => book.id === id ? { ...book, ...next } : book));

  return <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 md:pt-10">
    <header className="rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_90%_10%,hsl(var(--primary)/0.16),transparent_36%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))] px-5 py-6 shadow-[0_24px_60px_-52px_rgba(0,0,0,0.6)] sm:px-8 sm:py-8"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary"><BookOpen className="h-6 w-6" /></span><div><p className="text-sm font-medium text-primary">قفسه‌ی در حال مطالعه</p><h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">ادامه‌ی مسیر خواندن</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">پیشرفتت را نگه دار و هر بار دقیقاً از جایی که ماندی ادامه بده.</p></div></div></header>
    {books.length === 0 ? <EmptyState libraryHref={libraryHref} /> : <><div className="relative mt-6"><Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جست‌وجو در کتاب‌های در حال مطالعه" className="h-11 rounded-2xl border-border bg-card/70 pr-10 shadow-sm" /></div>{visibleBooks.length === 0 ? <p className="py-14 text-center text-sm text-muted-foreground">کتابی با این جست‌وجو پیدا نشد.</p> : <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleBooks.map((book) => <ReadingShelfCard key={book.id} book={book} onUpdated={(next) => updateBook(book.id, next)} onFinished={() => updateBook(book.id, { status: "FINISHED" })} />)}</section>}</>}
  </main>;
}

function EmptyState({ libraryHref }: { libraryHref: string }) { return <section className="mt-6 rounded-[2rem] border border-dashed border-border bg-card/40 px-5 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="h-7 w-7" /></span><h2 className="mt-5 text-lg font-black text-foreground">کتابی در حال مطالعه نداری</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">یک کتاب از کتابخانه‌ات شروع کن تا جای خواندنت همیشه همین‌جا منتظرت باشد.</p><Button asChild className="mt-6 gap-2 rounded-xl"><Link href={libraryHref}><Plus className="h-4 w-4" />دیدن کتابخانه</Link></Button></section>; }

function ReadingShelfCard({ book, onUpdated, onFinished }: { book: CurrentlyReadingBook; onUpdated: (book: Partial<ReadingBook>) => void; onFinished: () => void }) {
  const [open, setOpen] = useState(false); const percent = readingPercent(book);
  return <article className="group overflow-hidden rounded-[1.6rem] border border-border/70 bg-card/65 p-3 shadow-[0_18px_44px_-38px_rgba(0,0,0,0.65)] transition-transform duration-300 hover:-translate-y-0.5"><div className="flex gap-3"><div className="relative h-32 w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-muted shadow-md"><BookCoverImage src={book.coverImage} alt={book.title} fill className="object-cover" sizes="88px" /></div><div className="flex min-w-0 flex-1 flex-col py-1"><h2 className="line-clamp-2 text-sm font-black leading-6 text-foreground">{book.title}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{book.author}</p><div className="mt-auto"><div className="flex items-center justify-between gap-2 text-[11px]"><span className="font-black text-primary">{percent}%</span><span className="text-muted-foreground">{book.pageCount ? `${book.currentPage.toLocaleString("fa-IR")} / ${book.pageCount.toLocaleString("fa-IR")} صفحه` : "تعداد صفحات نامشخص"}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-l from-primary to-emerald-400 transition-[width] duration-500" style={{ width: `${percent}%` }} /></div><p className="mt-2 text-[10px] text-muted-foreground">آخرین ثبت: {relativeTime(book.readingUpdatedAt)}</p></div></div></div><Button type="button" onClick={() => setOpen(true)} className="mt-3 h-10 w-full rounded-xl text-xs">ادامه‌ی مطالعه</Button><ReadingManagementModal book={book} open={open} onOpenChange={setOpen} onUpdated={onUpdated} onFinished={onFinished} /></article>;
}
