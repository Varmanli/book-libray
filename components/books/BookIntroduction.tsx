"use client";

import { useState } from "react";
import { BookOpenText, ChevronDown, Clock3 } from "lucide-react";

import RichTextContent from "@/components/content/RichTextContent";

function getReadingTime(content: string) {
  const words = content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 180));
}

export default function BookIntroduction({
  content,
}: {
  content: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const plainText = (content ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const isExpandable = plainText.length > 280;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-md transition-all hover:border-border/80 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <BookOpenText className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground sm:text-lg">
              درباره کتاب
            </h2>
          </div>
        </div>

        {content ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <Clock3 className="h-3 w-3" />
            {getReadingTime(content).toLocaleString("fa-IR")} دقیقه
          </span>
        ) : null}
      </div>

      {content ? (
        <>
          <div
            className={`relative mt-4 transition-all duration-300 ${
              isExpandable && !isExpanded
                ? "max-h-24 overflow-hidden"
                : "max-h-[1000px]"
            }`}
          >
            <RichTextContent
              content={content}
              className="text-xs leading-relaxed text-foreground/90 sm:text-sm sm:leading-7 [&_a]:text-primary [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-r-2 [&_blockquote]:border-primary/30 [&_blockquote]:pr-3 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pr-5 [&_p]:mb-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pr-5"
            />
            {isExpandable && !isExpanded ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card/90 via-card/50 to-transparent" />
            ) : null}
          </div>

          {isExpandable ? (
            <div className="mt-3 border-t border-border/30 pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                aria-expanded={isExpanded}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                {isExpanded ? "نمایش کمتر" : "بیشتر بخوانید"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border/50 bg-background/30 px-4 py-7 text-center">
          <p className="text-xs font-medium text-foreground">
            هنوز توضیحی برای این کتاب ثبت نشده است.
          </p>
        </div>
      )}
    </section>
  );
}
