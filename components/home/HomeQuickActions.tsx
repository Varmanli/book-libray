import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowUpLeft,
  BookOpenText,
  LibraryBig,
  MessageSquareQuote,
  Search,
} from "lucide-react";

import HomeSectionHeader from "@/components/home/HomeSectionHeader";

interface IntroBanner {
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: ElementType;
}

function IntroBannerCard({
  banner,
  featured = false,
}: {
  banner: IntroBanner;
  featured?: boolean;
}) {
  return (
    <Link
      href={banner.href}
      className={[
        "group relative overflow-hidden rounded-[1.8rem] border p-5 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-primary/30",
        featured
          ? "border-primary/20 bg-primary/[0.08] shadow-[0_30px_90px_-64px_rgba(128,167,150,0.75)]"
          : "border-border/70 bg-card/55 shadow-[0_24px_70px_-58px_rgba(0,0,0,0.85)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-80" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-emerald-300/5 blur-3xl" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.13) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative flex min-h-[210px] flex-col">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary/18">
            <banner.icon className="h-5 w-5" />
          </span>

          <ArrowUpLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>

        <div className="mt-7">
          <span className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
            {banner.label}
          </span>

          <h3 className="mt-4 text-xl font-black leading-8 tracking-tight text-foreground sm:text-2xl">
            {banner.title}
          </h3>

          <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">
            {banner.description}
          </p>
        </div>

        <div className="mt-auto pt-6">
          <span className="inline-flex items-center gap-2 text-xs font-black text-primary">
            {banner.cta}
            <ArrowUpLeft className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HomeQuickActions({
  isLoggedIn,
  libraryHref,
  profileHref,
}: {
  isLoggedIn: boolean;
  libraryHref: string;
  profileHref: string;
}) {
  const banners: IntroBanner[] = [
    {
      label: "کشف کتاب",
      title: "کتاب بعدی‌ات را پیدا کن",
      description:
        "در میان کتاب‌ها، نویسنده‌ها، ژانرها و پیشنهادهای متنوع بگرد و کتاب‌هایی نزدیک به سلیقه‌ات پیدا کن.",
      href: "/books",
      cta: "جستجو در کتاب‌ها",
      icon: Search,
    },
    {
      label: "کتابخانه شخصی",
      title: "مسیر خواندنت را بساز",
      description:
        "کتاب‌هایی را که خوانده‌ای، می‌خوانی یا می‌خواهی بخوانی ثبت کن و قفسه شخصی خودت را مرتب نگه دار.",
      href: isLoggedIn ? libraryHref : "/auth/signup",
      cta: isLoggedIn ? "رفتن به کتابخانه" : "شروع ساخت قفسه",
      icon: LibraryBig,
    },
    {
      label: "یادداشت و تکه‌ها",
      title: "از خواندن فقط عبور نکن",
      description:
        "جمله‌های ماندگار، یادداشت‌ها و برداشت‌های شخصی‌ات را ثبت کن و تجربه خواندنت را عمیق‌تر کن.",
      href: isLoggedIn ? profileHref : "/blog",
      cta: isLoggedIn ? "دیدن پروفایل من" : "مطالعه بیشتر",
      icon: MessageSquareQuote,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-border/65 bg-secondary/25 px-4 py-6 shadow-[0_30px_100px_-72px_rgba(0,0,0,0.9)] sm:px-6 sm:py-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-emerald-300/5 blur-3xl" />

      <div className="relative">
        <HomeSectionHeader
          icon={BookOpenText}
          eyebrow="معرفی قفسه"
          title="سه راه ساده برای شروع کتاب‌خوانی در قفسه"
        />

        <div className="grid gap-3 md:grid-cols-3">
          {banners.map((banner, index) => (
            <IntroBannerCard
              key={banner.title}
              banner={banner}
              featured={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
