import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import {
  FiArchive,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiEdit3,
  FiGrid,
  FiHeart,
  FiMapPin,
  FiStar,
  FiUserCheck,
  FiUserPlus,
} from "react-icons/fi";

import { getCurrentUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/book/detail-service";
import PublicShell from "@/components/PublicShell";
import { Carousel } from "@/components/ui/Carousel";
import ReadingStatusControl from "@/components/books/ReadingStatusControl";
import ReferenceChip from "@/components/books/ReferenceChip";
import MetaAvatar from "@/components/books/MetaAvatar";
import BookQuotesSection from "@/components/books/BookQuotesSection";
import BookNotesSection from "@/components/books/BookNotesSection";
import BookExternalLinksPanel from "@/components/books/BookExternalLinksPanel";
import RichTextContent from "@/components/content/RichTextContent";
import { BookOpenText } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";
import { toAbsoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

const PLACEHOLDER = "/placeholder-cover.svg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getBookDetail(decodeURIComponent(id));

  if (!result.found) {
    return { title: "کتاب پیدا نشد | قفسه" };
  }

  const { book } = result;
  const description =
    book.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
    `معرفی، نقل‌قول‌ها و اطلاعات کتاب ${book.title} نوشته ${book.author} در قفسه.`;

  return buildPageMetadata({
    title: `${book.title} اثر ${book.author}`,
    description,
    path: `/book/${encodeURIComponent(book.slug)}`,
    image: book.coverImage,
    type: "book",
    keywords: [book.title, book.author, ...(book.genres.map((genre) => genre.name))],
  });
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ref = decodeURIComponent(id);
  const viewer = await getCurrentUser();
  const result = await getBookDetail(ref, viewer?.id);

  if (!result.found) notFound();

  const {
    book,
    viewer: entry,
    stats,
    topMoods,
    refLinks,
    refImages,
    authorChip,
    translatorChip,
    quotes,
    notes,
    externalLinks,
  } = result;

  // URL کانونی بر پایه‌ی اسلاگ است؛ لینک‌های قدیمیِ UUID (یا هر مرجع غیرکانونی)
  // با ریدایرکت دائمی به اسلاگ هدایت می‌شوند.
  if (ref !== book.slug) {
    permanentRedirect(`/book/${encodeURIComponent(book.slug)}`);
  }

  const isLoggedIn = !!viewer;
  const loginHref = `/auth/login?redirect=/book/${encodeURIComponent(book.slug)}`;
  const entryId = entry?.id ?? null;
  const genreList = book.genres.map((genre) => genre.name);
  const primaryGenre = book.genres[0];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "قفسه", url: toAbsoluteUrl("/") },
    { name: "کتاب‌ها", url: toAbsoluteUrl("/books") },
    {
      name: book.title,
      url: toAbsoluteUrl(`/book/${encodeURIComponent(book.slug)}`),
    },
  ]);
  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    alternateName: book.originalTitle || undefined,
    description:
      book.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
      undefined,
    image: book.coverImage ? [toAbsoluteUrl(book.coverImage)] : undefined,
    inLanguage: book.language || "fa",
    numberOfPages: book.pageCount ?? undefined,
    datePublished: book.publishedYear ? String(book.publishedYear) : undefined,
    author: [{ "@type": "Person", name: book.author }],
    translator: book.translator
      ? [{ "@type": "Person", name: book.translator }]
      : undefined,
    publisher: book.publisher
      ? { "@type": "Organization", name: book.publisher }
      : undefined,
    genre: genreList.length > 0 ? genreList : undefined,
    aggregateRating:
      stats.averageRating != null && stats.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: stats.averageRating,
            ratingCount: stats.ratingCount,
            bestRating: 10,
            worstRating: 1,
          }
        : undefined,
    mainEntityOfPage: toAbsoluteUrl(`/book/${encodeURIComponent(book.slug)}`),
  };

  const { wantToReadCount, readingCount, finishedCount } = stats;

  const metaItems: ReactNode[] = [
    <BookMetaItem
      key="viewer-rating"
      icon={<FiStar className="h-4 w-4" />}
      label="امتیاز تو"
      value={
        entry?.rating != null
          ? `${entry.rating.toLocaleString("fa-IR")} از ۱۰`
          : "—"
      }
    />,
    book.genres.length > 0 && (
      <BookMetaItem
        key="genre"
        icon={<FiGrid className="h-4 w-4" />}
        label="دسته‌بندی"
        value={genreList.join("، ")}
        valueAvatar={<MetaAvatar name={genreList[0]} fallback={<FiGrid />} />}
        href={
          book.genres.length === 1 && primaryGenre?.slug
            ? `/genres/${encodeURIComponent(primaryGenre.slug)}`
            : undefined
        }
      />
    ),
    book.country && (
      <BookMetaItem
        key="country"
        icon={<FiMapPin className="h-4 w-4" />}
        label="کشور"
        value={book.country}
        valueAvatar={
          <MetaAvatar
            image={refImages.country}
            name={book.country}
            fallback={<FiMapPin />}
          />
        }
        href={
          refLinks.country
            ? `/countries/${encodeURIComponent(refLinks.country)}`
            : undefined
        }
      />
    ),
    book.translator && (
      <BookMetaItem
        key="translator"
        icon={<FiEdit3 className="h-4 w-4" />}
        label="مترجم"
        value={book.translator}
        valueAvatar={
          <MetaAvatar
            image={translatorChip?.image}
            name={book.translator}
            fallback={<FiEdit3 />}
          />
        }
        href={translatorChip?.href ?? undefined}
      />
    ),
    book.publisher && (
      <BookMetaItem
        key="publisher"
        icon={<FiArchive className="h-4 w-4" />}
        label="ناشر"
        value={book.publisher}
        href={
          refLinks.publisher
            ? `/publishers/${encodeURIComponent(refLinks.publisher)}`
            : undefined
        }
      />
    ),
    book.pageCount != null && (
      <BookMetaItem
        key="pageCount"
        icon={<FiBookOpen className="h-4 w-4" />}
        label="تعداد صفحه"
        value={book.pageCount.toLocaleString("fa-IR")}
      />
    ),
    book.publishedYear != null && (
      <BookMetaItem
        key="publishedYear"
        icon={<FiCalendar className="h-4 w-4" />}
        label="سال انتشار"
        value={book.publishedYear.toLocaleString("fa-IR")}
      />
    ),
  ].filter(Boolean);

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(breadcrumbJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(bookJsonLd),
          }}
        />
        <section className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-[#101815]/90 p-4 shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-6 lg:p-8 xl:p-10">
          {/* Premium cinematic background */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/20 to-transparent" />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(128,167,150,0.18),transparent_34%),radial-gradient(circle_at_18%_70%,rgba(43,98,82,0.16),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.035),transparent_45%,rgba(128,167,150,0.04))]" />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="pointer-events-none absolute -right-28 top-8 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-32 bottom-10 h-80 w-80 rounded-full bg-emerald-300/5 blur-3xl" />

          {/* Abstract book/page inspired lines */}
          <div className="pointer-events-none absolute -left-24 bottom-12 h-52 w-[42rem] rounded-[50%] border border-primary/10" />
          <div className="pointer-events-none absolute -left-16 bottom-6 h-56 w-[46rem] rounded-[50%] border border-white/5" />
          <div className="pointer-events-none absolute -right-20 top-16 h-[26rem] w-[32rem] rounded-[50%] border border-primary/10" />
          <div className="relative flex flex-col-reverse gap-8 lg:flex-row-reverse lg:items-start lg:gap-8 xl:gap-10">
            {/* External links column - left side on desktop */}
            {externalLinks.length > 0 ? (
              <aside className="w-full shrink-0 lg:w-[250px] xl:w-[280px]">
                <BookExternalLinksPanel links={externalLinks} />
              </aside>
            ) : null}

            {/* Main book info column */}
            <div className="min-w-0 flex-1 text-center lg:pt-3 lg:text-right">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {genreList.length > 0 ? (
                  genreList.map((genre) => (
                    <BookPill key={genre}>{genre}</BookPill>
                  ))
                ) : (
                  <BookPill>صفحه کتاب</BookPill>
                )}

                {book.language ? (
                  <BookPill tone="muted">{book.language}</BookPill>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-black leading-[1.25] tracking-tight text-foreground drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:text-4xl lg:max-w-3xl lg:text-5xl xl:text-[3.4rem]">
                {book.title}
              </h1>

              {book.originalTitle ? (
                <p
                  dir="ltr"
                  className="mt-3 text-sm font-medium tracking-wide text-muted-foreground/85 lg:text-right"
                >
                  {book.originalTitle}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col items-center gap-3 lg:items-start">
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 lg:justify-start">
                  <ReferenceChip
                    name={authorChip.name}
                    href={authorChip.href}
                    image={authorChip.image}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/10 px-3.5 py-2 text-sm backdrop-blur-md">
                    <FiStar
                      className={
                        stats.averageRating != null
                          ? "h-4 w-4 text-amber-400"
                          : "h-4 w-4 text-muted-foreground"
                      }
                    />

                    {stats.averageRating != null ? (
                      <>
                        <span className="font-bold tabular-nums text-foreground">
                          {stats.averageRating.toLocaleString("fa-IR")} از ۱۰
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({stats.ratingCount.toLocaleString("fa-IR")} امتیاز)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-muted-foreground">
                          امتیاز این کتاب
                        </span>
                        <span className="font-bold text-muted-foreground">
                          —
                        </span>
                      </>
                    )}
                  </div>

                  {topMoods.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
                      {topMoods.slice(0, 3).map((mood) => (
                        <span
                          key={mood}
                          className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                        >
                          {mood}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex justify-center lg:justify-start">
                <div className="w-full max-w-xl">
                  <ReadingStatusControl
                    subjectBookId={book.id}
                    viewer={entry}
                    isLoggedIn={isLoggedIn}
                    loginHref={loginHref}
                    averageRating={stats.averageRating}
                    ratingCount={stats.ratingCount}
                  />
                </div>
              </div>

              <div className="mt-5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="mx-auto flex w-max items-center gap-2.5 lg:mx-0">
                  <BookMiniStat
                    icon={<FiUserPlus className="h-4 w-4" />}
                    value={wantToReadCount}
                    label="می‌خواهند بخوانند"
                  />

                  <BookMiniStat
                    icon={<FiClock className="h-4 w-4" />}
                    value={readingCount}
                    label="درحال خواندن"
                  />

                  <BookMiniStat
                    icon={<FiUserCheck className="h-4 w-4" />}
                    value={finishedCount}
                    label="خوانده‌اند"
                  />

                  {entry?.isFavorite ? (
                    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-rose-300/20 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-foreground shadow-[0_18px_45px_-34px_rgba(244,63,94,0.8)] backdrop-blur">
                      <FiHeart className="h-4 w-4 text-rose-400" />
                      علاقه‌مندی تو
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Cover column - right side on desktop */}
            <div className="mx-auto w-full max-w-[230px] shrink-0 sm:max-w-[250px] lg:mx-0 lg:w-[260px] lg:max-w-none">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-primary/12 blur-3xl" />
                <div className="pointer-events-none absolute -inset-2 rounded-[1.7rem] bg-gradient-to-b from-white/10 via-transparent to-black/20" />

                <div className="relative aspect-[2/3] overflow-hidden rounded-[1.45rem] bg-secondary/40 shadow-[0_34px_86px_-42px_rgba(0,0,0,0.92)] ring-1 ring-white/10">
                  <Image
                    src={book.coverImage || PLACEHOLDER}
                    alt={book.title}
                    fill
                    sizes="(min-width: 1024px) 260px, (min-width: 640px) 250px, 230px"
                    className="object-cover"
                    priority
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/24 via-transparent to-white/8" />
                </div>
              </div>
            </div>
          </div>

          {metaItems.length > 0 ? (
            <Carousel
              className="relative mt-9"
              ariaLabel="مشخصات کتاب"
              align="start"
              slideClassName="basis-[170px] sm:basis-[185px] lg:basis-[195px]"
              containerClassName="justify-start gap-3"
              slides={metaItems}
              controls={false}
            />
          ) : null}

          <section className="relative mt-9 overflow-hidden rounded-[2rem] border border-border/70 bg-card/65 p-5 shadow-[0_24px_80px_-52px_rgba(0,0,0,0.85)] backdrop-blur-md sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-emerald-400/5 blur-3xl" />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.13) 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />

            <div className="relative flex items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 shadow-[0_18px_45px_-34px_rgba(128,167,150,0.9)]">
                <BookOpenText className="h-5 w-5" />
              </span>

              <div>
                <h2 className="text-base font-black text-foreground">
                  درباره کتاب
                </h2>
              </div>
            </div>

            <div className="relative mt-5 overflow-hidden rounded-[1.6rem] border border-border/70 bg-background/40 px-4 py-5 shadow-inner sm:px-5 sm:py-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%, transparent)",
                  backgroundSize: "26px 26px",
                }}
              />

              <div className="pointer-events-none absolute inset-y-5 right-0 w-1 rounded-full bg-gradient-to-b from-primary/70 via-primary/35 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-primary/[0.06] via-transparent to-transparent" />

              {book.description ? (
                <RichTextContent
                  content={book.description}
                  className="relative z-10 space-y-4 pr-5 text-start text-sm font-medium sm:text-[15px] sm:leading-9 برای بلاگ آینده"
                />
              ) : (
                <div className="relative z-10 flex min-h-32 flex-col items-center justify-center rounded-[1.2rem] border border-dashed border-border/75 bg-card/45 px-4 py-8 text-center">
                  <p className="text-sm font-black text-foreground">
                    هنوز توضیحی برای این کتاب ثبت نشده
                  </p>

                  <p className="mt-2 max-w-xl text-xs leading-6 text-muted-foreground">
                    وقتی خلاصه یا معرفی کتاب اضافه شود، این بخش اطلاعات
                    خواندنی‌تری از فضای اثر به خواننده می‌دهد.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
        <div className="mt-10 lg:mt-12">
          <BookQuotesSection
            subjectBookId={book.id}
            viewerEntryId={entryId}
            isLoggedIn={isLoggedIn}
            quotes={quotes}
            viewAllHref={`/book/${encodeURIComponent(book.slug)}/quotes`}
          />
        </div>

        <div className="mt-10 lg:mt-12">
          <BookNotesSection
            subjectBookId={book.id}
            viewerEntryId={entryId}
            isLoggedIn={isLoggedIn}
            notes={notes}
          />
        </div>
      </div>
    </PublicShell>
  );
}

function BookMiniStat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3.5 py-2 text-xs font-medium text-foreground backdrop-blur">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-bold tabular-nums text-foreground">
        {value.toLocaleString("fa-IR")}
      </span>
      <span>{label}</span>
    </span>
  );
}

function BookMetaItem({
  icon,
  label,
  value,
  valueAvatar,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueAvatar?: ReactNode;
  href?: string;
}) {
  const className =
    "group relative block h-full min-h-[86px] overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/55 px-4 py-4 text-right backdrop-blur-md transition-colors hover:border-primary/25 hover:bg-card/75";
  const inner = (
    <>
      <div className="flex items-center justify-start gap-2">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          {icon}
        </span>

        <span className="text-[13px] font-extrabold text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {valueAvatar}
        <span
          className={
            "line-clamp-1 text-base font-black leading-7 text-foreground" +
            (href ? " transition-colors group-hover:text-primary" : "")
          }
        >
          {value}
        </span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

function BookPill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "muted";
}) {
  return (
    <span
      className={
        tone === "default"
          ? "inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary"
          : "inline-flex rounded-full border border-border/80 bg-background/65 px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
      }
    >
      {children}
    </span>
  );
}
