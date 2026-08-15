"use client";

import { BookOpenText, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

import CollapsibleContent from "@/components/content/CollapsibleContent";
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
  flat = false,
}: {
  content: string | null;
  flat?: boolean;
}) {
  return (
    <section className={cn("relative", !flat ? "overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-md transition-all hover:border-border/80 sm:p-5" : "px-1")}>
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
        <CollapsibleContent className="mt-4">
          <RichTextContent
            content={content}
            className="text-xs leading-relaxed text-foreground/90 sm:text-sm sm:leading-7 [&_a]:text-primary [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-r-2 [&_blockquote]:border-primary/30 [&_blockquote]:pr-3 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pr-5 [&_p]:mb-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pr-5"
          />
        </CollapsibleContent>
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
