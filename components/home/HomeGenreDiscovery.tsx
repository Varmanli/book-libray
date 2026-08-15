import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";

import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import type { HomeGenreDiscovery as Genre } from "@/lib/home/service";
import { getPublicGenreHref } from "@/lib/genre/paths";

export default function HomeGenreDiscovery({ genres }: { genres: Genre[] }) {
  if (!genres.length) return null;

  return (
    <section dir="rtl">
      <HomeSectionHeader
        icon={Tags}
        title="ژانرت را پیدا کن"
        href="/genres"
        linkLabel="همه ژانرها"
      />

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            href={getPublicGenreHref(genre)!}
            className="
              group flex min-h-[72px] items-center justify-between gap-3
              rounded-2xl border border-border/70 bg-card/60
              px-3.5 py-3
              transition-all duration-200

              hover:border-primary/25
              hover:bg-primary/[0.04]

              sm:min-h-[105px]
              sm:flex-col
              sm:items-stretch
              sm:justify-between
              sm:p-4
            "
          >
            {/* mobile + desktop top */}
            <div className="flex min-w-0 items-center gap-3 sm:justify-between">
              <span
                className="
                  flex h-10 w-10 shrink-0 items-center justify-center
                  rounded-xl border border-primary/10
                  bg-primary/[0.07] text-primary
                  transition-all duration-200

                  group-hover:bg-primary
                  group-hover:text-primary-foreground
                "
              >
                <Tags className="h-4 w-4" strokeWidth={2} />
              </span>

              <div className="min-w-0 sm:hidden">
                <h3 className="truncate text-sm font-black text-foreground">
                  {genre.name}
                </h3>

                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  {genre.bookCount.toLocaleString("fa-IR")} کتاب
                </p>
              </div>

              <span
                className="
                  hidden h-7 w-7 items-center justify-center
                  rounded-full border border-border/70
                  text-muted-foreground transition

                  group-hover:border-primary/20
                  group-hover:bg-primary
                  group-hover:text-primary-foreground

                  sm:flex
                "
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* desktop content */}
            <div className="hidden sm:block">
              <h3 className="truncate text-[15px] font-black text-foreground transition-colors group-hover:text-primary">
                {genre.name}
              </h3>

              <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                {genre.bookCount.toLocaleString("fa-IR")} کتاب
              </p>
            </div>

            {/* mobile arrow */}
            <span
              className="
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-full bg-muted/60 text-muted-foreground
                transition-all duration-200
                group-hover:bg-primary
                group-hover:text-primary-foreground
                sm:hidden
              "
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
