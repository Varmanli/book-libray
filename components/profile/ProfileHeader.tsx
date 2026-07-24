import Link from "next/link";
import { CalendarDays, Lock, MapPin, Settings } from "lucide-react";
import type { ElementType } from "react";

import ReaderRankBadge from "@/components/profile/ReaderRankBadge";
import ProfileBio from "@/components/profile/ProfileBio";

export interface ProfileSocialLink {
  href: string;
  label: string;
  icon: ElementType;
}

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
    <section className="overflow-hidden rounded-[1.6rem] border border-border/80 bg-card/80 shadow-[0_20px_55px_-46px_rgba(0,0,0,0.4)] sm:rounded-[2rem]">
      {/* Banner */}
      <div className="relative h-24 overflow-hidden sm:h-36 lg:h-44">
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

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_32%)] dark:bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_32%)]" />

        <div className="absolute right-3 top-3 origin-top-right scale-90 sm:right-4 sm:top-4 sm:scale-100">
          <ReaderRankBadge finished={finished} />
        </div>

        {isOwner && visibility === "PRIVATE" ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-500/12 px-2 py-1 text-[10px] font-bold text-amber-100 backdrop-blur-sm sm:left-4 sm:top-4 sm:gap-1.5 sm:px-2.5 sm:text-xs dark:text-amber-200">
            <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            خصوصی
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="px-4 pb-5 sm:px-7 sm:pb-7">
        {/* Identity */}
        <div className="flex items-end gap-3.5 sm:gap-4">
          {/* Avatar */}
          <div className="relative z-10 -mt-8 shrink-0 sm:-mt-12">
            <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-full border border-border/70 bg-secondary text-xl font-bold text-foreground ring-[3px] ring-background shadow-sm sm:h-28 sm:w-28 sm:text-3xl sm:ring-4">
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

            {/* Owner settings */}
            {isOwner ? (
              <Link
                href="/settings/profile"
                aria-label="تنظیمات پروفایل"
                title="تنظیمات پروفایل"
                className="absolute -bottom-1 -left-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-card bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-8 sm:w-8"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            ) : null}
          </div>

          {/* Name + username */}
          <div className="min-w-0 pb-1 sm:pb-1.5">
            <div className="flex min-w-0 flex-col items-start gap-1">
              <h1 className="max-w-full truncate text-base font-black leading-tight tracking-tight text-foreground sm:text-[1.8rem]">
                {displayName}
              </h1>

              <span
                dir="ltr"
                className="inline-flex max-w-full items-center text-[11px] font-medium text-muted-foreground sm:text-xs"
              >
                @{username}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio ? (
          <ProfileBio bio={bio} />
        ) : (
          <p className="mt-5 text-[11px] text-muted-foreground sm:mt-4 sm:text-sm">
            هنوز توضیحی برای این پروفایل ثبت نشده است.
          </p>
        )}

        {/* Meta */}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/60 pt-4 sm:mt-5 sm:gap-5 sm:border-0 sm:pt-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
            <CalendarDays className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" />
            عضو از {joined}
          </span>

          {location ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
              <MapPin className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" />

              <span className="max-w-[7rem] truncate sm:max-w-none">
                {location}
              </span>
            </span>
          ) : null}

          {socialLinks.length > 0 ? (
            <div className="ms-auto flex shrink-0 items-center gap-2.5 sm:gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={link.label}
                  title={link.label}
                  className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <link.icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
