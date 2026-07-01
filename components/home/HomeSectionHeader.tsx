import type { LucideIcon } from "lucide-react";

export default function HomeSectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:gap-4">
      <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card text-primary shadow-sm shadow-black/5">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        {eyebrow ? (
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
