"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Quote as QuoteIcon } from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicQuote } from "@/lib/quotes/service";
import { cn } from "@/lib/utils";
import { getQuoteDirectionProps } from "@/lib/text-direction";

export default function QuoteReadingDialog({
  open,
  onOpenChange,
  quote,
  quoteText,
  bookHref,
  showBook,
  renderBackground,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PublicQuote;
  quoteText: string;
  bookHref: string;
  showBook: boolean;
  renderBackground: () => ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2rem] border-border/60 bg-card p-0 shadow-2xl sm:max-w-3xl">
        <div className="relative border-b border-border/45 px-5 py-5 sm:px-7 sm:py-6">
          {renderBackground()}

          <div className="relative z-10 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <QuoteIcon className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <DialogTitle className="text-base font-black text-foreground sm:text-lg">
                تکه کتاب
              </DialogTitle>

              <DialogDescription className="mt-1 truncate text-xs text-muted-foreground">
                {showBook ? quote.bookTitle : "خوانش کامل تکه"}
                {quote.page
                  ? ` · صفحه ${quote.page.toLocaleString("fa-IR")}`
                  : ""}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-7">
          {quote.imageKey ? (
            <div className="mb-5 flex max-h-[70dvh] w-full items-start justify-center overflow-auto rounded-[1.65rem] border border-border/50 bg-black/15 p-3">
              <BookCoverImage
                src={quote.imageKey}
                alt={`تصویر تکه‌ای از کتاب «${quote.bookTitle}»`}
                width={1200}
                height={1600}
                className="h-auto max-h-none w-auto max-w-full object-contain"
              />
            </div>
          ) : null}

          {quoteText ? (
            <div
              className={cn(
                "relative overflow-hidden rounded-[1.65rem]",
                "border border-border/50 bg-background/35",
                "px-6 py-9 shadow-inner",
                "sm:px-10 sm:py-12",
              )}
            >
              {renderBackground()}
              <QuoteIcon className="pointer-events-none absolute right-7 top-7 h-10 w-10 text-primary/10" />
              <QuoteIcon className="pointer-events-none absolute bottom-7 left-7 h-10 w-10 rotate-180 text-primary/10" />
              <p
                {...getQuoteDirectionProps(quoteText)}
                className="relative z-10 whitespace-pre-line text-center text-sm font-medium leading-8 text-foreground/95 sm:text-[0.98rem] sm:leading-[2.45] md:text-[1rem]"
              >
                {quoteText}
              </p>
            </div>
          ) : null}

          {showBook ? (
            <Link
              href={bookHref}
              onClick={() => onOpenChange(false)}
              className={cn(
                "mt-5 inline-flex h-11 items-center gap-2",
                "rounded-2xl bg-primary px-4",
                "text-sm font-black text-primary-foreground",
                "shadow-lg shadow-primary/15",
                "transition-transform hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              مشاهده کتاب
              <ExternalLink className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
