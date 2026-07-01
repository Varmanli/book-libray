import Link from "next/link";
import { CalendarDays, Lock, MapPin } from "lucide-react";
import type { ElementType } from "react";

import { Button } from "@/components/ui/button";
import ReaderRankBadge from "@/components/profile/ReaderRankBadge";

export interface ProfileSocialLink {
  href: string;
  label: string;
  icon: ElementType;
}

/**
 * Social-style profile header: banner background with a readability overlay, an
 * avatar overlapping the banner, identity + meta, social links, owner actions,
 * and the reader-rank badge. Server component; only the rank badge (modal) is
 * client.
 */
export default function ProfileHeader({
  name,
  username,
  image,
  bannerImage,
  bio,
  location,
  joined,
  visibility,
  isOwner,
  finished,
  socialLinks,
}: {
  name: string | null;
  username: string;
  image: string | null;
  bannerImage: string | null;
  bio: string | null;
  location: string | null;
  joined: string;
  visibility: "PUBLIC" | "PRIVATE";
  isOwner: boolean;
  finished: number;
  socialLinks: ProfileSocialLink[];
}) {
  const displayName = name || username;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 shadow-[0_24px_70px_-50px_rgba(0,0,0,0.42)]">
      <div className="relative h-32 overflow-hidden rounded-t-[2rem] sm:h-40 lg:h-44">
        {bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerImage}
            alt={`بنر پروفایل ${displayName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(128,167,150,0.2),transparent_42%),radial-gradient(circle_at_top_left,rgba(43,98,82,0.16),transparent_38%),linear-gradient(135deg,var(--surface-2),var(--card))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/10 dark:from-black/60 dark:via-black/15 dark:to-black/25" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_32%)] dark:bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_32%)]" />

        <div className="absolute right-4 top-4">
          <ReaderRankBadge finished={finished} />
        </div>
        {isOwner && visibility === "PRIVATE" ? (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-500/12 px-2.5 py-1 text-xs font-bold text-amber-100 backdrop-blur-sm dark:text-amber-200">
            <Lock className="h-3.5 w-3.5" />
            خصوصی
          </span>
        ) : null}
      </div>

      <div className="px-5 pb-6 sm:px-7 sm:pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="relative z-10 -mt-10 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-secondary text-3xl font-bold text-foreground ring-4 ring-background shadow-[0_20px_44px_-28px_rgba(0,0,0,0.4)] sm:-mt-12 sm:h-28 sm:w-28">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground">
                  {displayName.trim().charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 sm:py-1.5">
              <div className="min-w-0 flex-1 text-center sm:text-right">
                <div className="flex min-w-0 flex-col items-center gap-1 sm:items-start">
                  <h1 className="max-w-full truncate text-xl font-black leading-tight tracking-tight text-foreground sm:text-[1.8rem]">
                    {displayName}
                  </h1>

                  <span
                    dir="ltr"
                    className="inline-flex max-w-full items-center rounded-full border border-border/60 bg-background/35 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
                  >
                    @{username}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isOwner ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end sm:pb-1.5">
              <Button
                asChild
                className="h-10 rounded-2xl px-4 text-sm font-semibold"
              >
                <Link href="/settings/profile">ویرایش پروفایل</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-2xl border-border/80 bg-background/65 px-4 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary"
              >
                <Link href="/dashboard">داشبورد</Link>
              </Button>
            </div>
          ) : null}
        </div>

        {bio ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-foreground/90">
            {bio}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            هنوز توضیحی برای این پروفایل ثبت نشده است.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/65 px-3 py-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            عضو از {joined}
          </span>
          {location ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/65 px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          ) : null}

          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
              {socialLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={l.label}
                  title={l.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/75 bg-background/65 text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <l.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
