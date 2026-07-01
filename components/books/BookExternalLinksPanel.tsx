import { ExternalLink, ShoppingBag } from "lucide-react";

import type { PublicBookExternalLink } from "@/lib/book/external-links";
import { cn } from "@/lib/utils";

/**
 * لینک‌های دسترسی به کتاب در صفحه عمومی کتاب.
 * مینیمال، بدون توضیح اضافه، بدون باکس سنگین.
 */
export default function BookExternalLinksPanel({
  links,
  className,
}: {
  links: PublicBookExternalLink[];
  className?: string;
}) {
  if (!links || links.length === 0) return null;

  return (
    <section className={cn("w-full text-right", className)}>
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <ShoppingBag className="h-4 w-4" />
        </span>

        <h2 className="text-sm font-black text-foreground">دسترسی به کتاب</h2>
      </div>

      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 px-3.5 py-3 text-sm font-bold text-foreground/90 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            <span className="line-clamp-1 min-w-0">{link.label}</span>

            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </a>
        ))}
      </div>
    </section>
  );
}
