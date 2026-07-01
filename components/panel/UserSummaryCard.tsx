import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function UserSummaryCard({
  user,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}: {
  user: {
    name: string | null;
    username: string;
    image: string | null;
    bio: string | null;
    profileVisibility?: "PUBLIC" | "PRIVATE";
  };
  title: string;
  subtitle: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}) {
  const displayName = user.name || user.username;

  return (
    <section className="overflow-hidden rounded-[36px] border border-border bg-[radial-gradient(circle_at_top_right,rgba(212,255,106,0.18),transparent_24%),radial-gradient(circle_at_top_left,rgba(60,132,255,0.16),transparent_26%),linear-gradient(180deg,#1f212b,#121319)] p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.95)] sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-white/8 text-3xl font-bold text-foreground ring-1 ring-white/10">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{displayName.trim().charAt(0)}</span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/7 px-3 py-1 text-xs text-foreground ring-1 ring-white/10">
                <Sparkles className="h-3.5 w-3.5" />
                {title}
              </span>
              {user.profileVisibility === "PRIVATE" ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/12 px-3 py-1 text-xs text-amber-200 ring-1 ring-amber-200/20">
                  <Lock className="h-3.5 w-3.5" />
                  خصوصی
                </span>
              ) : null}
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">
                {displayName}
              </h1>
              <p dir="ltr" className="mt-1 text-sm text-muted-foreground">
                @{user.username}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-foreground sm:text-base">
              {subtitle}
            </p>

            {user.bio ? (
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                {user.bio}
              </p>
            ) : null}
          </div>
        </div>

        {(primaryAction || secondaryAction) ? (
          <div className="flex flex-wrap gap-3">
            {primaryAction ? (
              <Button asChild className="h-11 rounded-2xl px-5 font-semibold">
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
            ) : null}
            {secondaryAction ? (
              <Button
                asChild
                variant="secondary"
                className="h-11 rounded-2xl bg-white/8 px-5 text-foreground hover:bg-white/12"
              >
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
