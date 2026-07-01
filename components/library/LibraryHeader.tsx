import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * هدر صفحه‌ی کتابخانه: بنر کاربر به‌عنوان پس‌زمینه، آواتار روی بنر، نام و
 * نام‌کاربری، نشان خصوصی‌بودن و اکشن‌های صاحب صفحه. مینیمال و هم‌راستا با
 * پالت مریم‌گلی قفسه.
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
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-sm">
      <div className="relative h-32 overflow-hidden sm:h-40 lg:h-44">
        {profile.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.bannerImage}
            alt={`بنر ${displayName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(128,167,150,0.35),transparent_55%),linear-gradient(135deg,#2B6252,#1f4a3e)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />

        {isPrivate ? (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Lock className="h-3.5 w-3.5" />
            خصوصی
          </span>
        ) : null}
      </div>

      <div className="px-5 pb-5 sm:px-7 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative z-10 -mt-10 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-secondary text-2xl font-bold text-foreground ring-4 ring-card sm:-mt-12 sm:h-24 sm:w-24">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground">
                  {displayName.trim().charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                {displayName}
              </h1>
              <p dir="ltr" className="truncate text-sm text-muted-foreground">
                @{profile.username}
              </p>
            </div>
          </div>

          {isOwner ? (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button asChild className="h-10 rounded-xl px-4 text-sm font-semibold">
                <Link href="/books/add">افزودن کتاب</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl px-4 text-sm font-medium"
              >
                <Link href="/settings/profile">ویرایش پروفایل</Link>
              </Button>
            </div>
          ) : null}
        </div>

        {profile.bio ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            {profile.bio}
          </p>
        ) : null}
      </div>
    </section>
  );
}
