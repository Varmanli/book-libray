import Link from "next/link";
import { Lock, Plus, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * هدر کامپکت کتابخانه.
 * ساختار هویت کاربر همیشه سمت راست باقی می‌ماند و در موبایل نیز center نمی‌شود.
 */
export default function LibraryHeader({
  profile,
  isOwner,
}: {
  profile: {
    displayName: string | null;
    username: string;
    image: string | null;
    bannerImage: string | null;
    bio: string | null;
    profileVisibility: "PUBLIC" | "PRIVATE";
  };
  isOwner: boolean;
}) {
  const displayName = profile.displayName || profile.username;
  const isPrivate = profile.profileVisibility === "PRIVATE";

  return (
    <section className="overflow-hidden rounded-xl border border-border/40 bg-card/35">
      {/* Banner */}
      <div className="relative h-16 overflow-hidden sm:h-20 lg:h-24">
        {profile.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.bannerImage}
            alt={`بنر ${displayName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(128,167,150,0.18),transparent_60%),linear-gradient(135deg,var(--primary-deep),var(--background))]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

        {isPrivate ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
            <Lock className="h-2.5 w-2.5" />
            خصوصی
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* User Identity */}
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Avatar */}
            <div className="relative z-10 -mt-5 h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border/80 bg-secondary ring-[3px] ring-card sm:-mt-7 sm:h-14 sm:w-14">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base font-bold text-muted-foreground">
                  {displayName.trim().charAt(0)}
                </div>
              )}
            </div>

            {/* Name */}
            <div className="min-w-0 pt-1 text-right">
              <h1 className="truncate text-sm font-extrabold text-foreground sm:text-base">
                {displayName}
              </h1>

              <p
                dir="ltr"
                className="mt-0.5 w-fit text-[10px] text-muted-foreground"
              >
                @{profile.username}
              </p>
            </div>
          </div>

          {/* Actions */}
          {isOwner ? (
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Button
                asChild
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-3 text-[11px] font-semibold"
              >
                <Link href="/books/add">
                  <Plus className="h-3.5 w-3.5" />
                  افزودن کتاب
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 rounded-lg px-3 text-[11px] font-medium"
              >
                <Link href="/settings/profile">
                  <Settings className="h-3.5 w-3.5" />
                  ویرایش
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
