import type { ElementType } from "react";
import {
  BookCopy,
  BookOpenCheck,
  Compass,
  LibraryBig,
  NotebookPen,
  Quote,
  UserRound,
} from "lucide-react";

import HomeSectionHeader from "@/components/home/HomeSectionHeader";

const FEATURES: Array<{
  title: string;
  description: string;
  icon: ElementType;
}> = [
  {
    title: "کتابخانه شخصی",
    description: "همه کتاب‌ها را با نظم ساده و قابل‌جست‌وجو کنار هم نگه دار.",
    icon: LibraryBig,
  },
  {
    title: "وضعیت خواندن",
    description: "بدان چه چیزی مانده، چه چیزی شروع شده و چه چیزی تمام شده است.",
    icon: BookOpenCheck,
  },
  {
    title: "تکه‌های کتاب",
    description: "جمله‌هایی را ذخیره کن که دوباره باید به آن‌ها برگردی.",
    icon: Quote,
  },
  {
    title: "یادداشت‌های عمومی و شخصی",
    description: "میان ثبت خصوصی و انتشار عمومی بدون پیچیدگی جابه‌جا شو.",
    icon: NotebookPen,
  },
  {
    title: "پروفایل خواندن",
    description: "قفسه عمومی‌ات را بساز تا دیگران مسیر مطالعه‌ات را ببینند.",
    icon: UserRound,
  },
  {
    title: "کشف کتاب‌های جدید",
    description:
      "از کتابخانه‌ها، نقل‌قول‌ها و مسیرهای خواندن دیگران الهام بگیر.",
    icon: Compass,
  },
];

export default function HomeFeatureCards() {
  return (
    <section>
      <HomeSectionHeader
        icon={BookCopy}
        eyebrow="کارهای اصلی"
        title="قفسه برای خواندن روزمره ساخته شده است"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-[1.6rem] border border-border/75 bg-card/90 p-5 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:border-primary/20"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/15">
              <feature.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-black text-foreground">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
