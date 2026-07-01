import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function EmptyPanelState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-border bg-white/[0.03] px-6 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/6 text-foreground">
        <BookOpen className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {ctaLabel && ctaHref ? (
        <Button asChild className="mt-6 rounded-2xl px-5">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
