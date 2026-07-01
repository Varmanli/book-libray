import Link from "next/link";
import { BookPlus, LayoutGrid, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * هدر داشبورد: مرکز شخصی مطالعه. بنر کوچک‌تر از صفحه‌ی کتابخانه، آواتار دایره‌ای،
 * سلام و خوشامد، و اکشن‌های سریع. هم‌راستا با زبان طراحی صفحه‌ی کتابخانه.
 */
export default function DashboardHeader({
  profile,
  libraryHref,
  profileHref,
}: {
  profile: {
    name: string | null;
    username: string;
    image: string | null;
    bannerImage: string | null;
  };
  libraryHref: string;
  profileHref: string;
}) {
  const displayName = profile.name || profile.username;

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-sm">
      <div className="relative h-24 overflow-hidden sm:h-28">
        {profile.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.bannerImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(128,167,150,0.35),transparent_55%),linear-gradient(135deg,#2B6252,#1f4a3e)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
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
                سلام، {displayName}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                امروز چه چیزی می‌خوانی؟
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button asChild className="h-10 gap-2 rounded-xl px-4 text-sm font-semibold">
              <Link href="/books/add">
                <BookPlus className="h-4 w-4" />
                افزودن کتاب
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 gap-2 rounded-xl px-4 text-sm font-medium"
            >
              <Link href={libraryHref}>
                <LayoutGrid className="h-4 w-4" />
                کتابخانه من
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 gap-2 rounded-xl px-4 text-sm font-medium"
            >
              <Link href={profileHref}>
                <UserRound className="h-4 w-4" />
                پروفایل من
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
