import { getCurrentUser } from "@/lib/auth/session";
import { getLibraryPath, getProfilePath } from "@/lib/library/paths";
import {
  getFeaturedBooks,
  getHeroSlides,
  getLatestHomeBlogPosts,
  getPopularBooks,
  getRecentHomeQuotes,
  HOME_FALLBACK_SLIDES,
  type HeroSlideView,
} from "@/lib/home/service";
import PublicShell from "@/components/PublicShell";
import HomeHeroSlider from "@/components/home/HomeHeroSlider";
import HomeQuickActions from "@/components/home/HomeQuickActions";
import HomeBookCarousel from "@/components/home/HomeBookCarousel";
import HomeQuotesSection from "@/components/home/HomeQuotesSection";
// import HomeReadingListsPreview from "@/components/home/HomeReadingListsPreview";
// import HomeFeatureCards from "@/components/home/HomeFeatureCards";
import HomeBlogPreview from "@/components/home/HomeBlogPreview";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    user,
    featuredBooks,
    popularBooks,
    recentQuotes,
    latestBlogPosts,
    dbHeroSlides,
  ] = await Promise.all([
    getCurrentUser(),
    getFeaturedBooks(12),
    getPopularBooks(12),
    getRecentHomeQuotes(10),
    getLatestHomeBlogPosts(3),
    getHeroSlides(),
  ]);

  // کتاب‌های پیشنهادی از انتخاب ادمین می‌آیند؛ در نبود انتخاب، fallback به
  // کتاب‌های اخیر عمومی (به‌صورت شفاف با برچسب «تازه‌ترین‌ها»).
  const hasFeatured = featuredBooks.length > 0;
  const showcaseBooks = hasFeatured ? featuredBooks : popularBooks;

  const isLoggedIn = !!user;
  const libraryHref = getLibraryPath(user?.username);
  const profileHref = getProfilePath(user?.username);

  // اسلایدر از انتخاب ادمین (DB) می‌آید؛ در نبود اسلاید فعال از HOME_FALLBACK_SLIDES
  // به‌عنوان داده‌ی پیش‌فرض استفاده می‌شود (نه محتوای ادمین).
  const resolveHref = (href: string) =>
    href === "/books"
      ? libraryHref
      : href === "/settings/profile"
        ? profileHref
        : href;

  const heroSlides: HeroSlideView[] =
    dbHeroSlides.length > 0
      ? dbHeroSlides
      : HOME_FALLBACK_SLIDES.map((slide) => ({
          id: slide.id,
          badge: slide.eyebrow,
          title: slide.title,
          description: slide.description,
          primaryLabel: isLoggedIn
            ? slide.memberPrimaryLabel
            : slide.guestPrimaryLabel,
          primaryHref: isLoggedIn
            ? resolveHref(slide.memberPrimaryHref)
            : slide.guestPrimaryHref,
          secondaryLabel:
            (isLoggedIn
              ? slide.memberSecondaryLabel
              : slide.guestSecondaryLabel) ?? null,
          secondaryHref:
            (isLoggedIn
              ? slide.memberSecondaryHref
                ? resolveHref(slide.memberSecondaryHref)
                : null
              : slide.guestSecondaryHref) ?? null,
          imageUrl: null,
          books: [],
        }));

  return (
    <PublicShell>
      <div className="relative overflow-x-clip">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_top,rgba(128,167,150,0.16),transparent_42%)]"
        />
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-10">
          <HomeHeroSlider slides={heroSlides} />

          <HomeQuickActions
            isLoggedIn={isLoggedIn}
            libraryHref={libraryHref}
            profileHref={profileHref}
          />

          <HomeBookCarousel books={showcaseBooks} isFallback={!hasFeatured} />

          <HomeQuotesSection quotes={recentQuotes} isLoggedIn={isLoggedIn} />

          {/* <HomeReadingListsPreview lists={HOME_PLACEHOLDER_LISTS} /> */}

          {/* <HomeFeatureCards /> */}

          <HomeBlogPreview posts={latestBlogPosts} />
        </div>
      </div>
    </PublicShell>
  );
}
