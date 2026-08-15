import Link from "next/link";
import { ArrowUpLeft, BookOpen, Newspaper, Shapes, Users } from "lucide-react";

import HomeSectionHeader from "@/components/home/HomeSectionHeader";

const destinations = [
  {
    href: "/books",
    title: "کتاب‌ها",
    description: "کتاب بعدی‌ات را میان آثار مختلف پیدا کن",
    icon: BookOpen,
    label: "کشف کتاب",
  },
  {
    href: "/authors",
    title: "نویسنده‌ها",
    description: "آثار، سبک و دنیای نویسندگان را بهتر بشناس",
    icon: Users,
    label: "آشنایی با نویسندگان",
  },
  {
    href: "/genres",
    title: "ژانرها",
    description: "از ادبیات روسیه تا رئالیسم جادویی",
    icon: Shapes,
    label: "مرور ژانرها",
  },
  {
    href: "/blog",
    title: "مجله قفسه",
    description: "راهنماها، یادداشت‌ها و پیشنهادهایی برای مطالعه",
    icon: Newspaper,
    label: "مطالعه مجله",
  },
];

export default function HomeExploreGhafaseh() {
  return (
    <section dir="rtl">
      <HomeSectionHeader icon={Shapes} title="در قفسه چه چیزی پیدا می‌کنی؟" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {destinations.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative min-h-[190px] overflow-hidden rounded-[26px] border border-border/70 bg-card p-5 shadow-sm shadow-black/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-black/[0.06]"
            >
              {/* subtle background glow */}
              <span className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/[0.06] blur-3xl transition-all duration-500 group-hover:bg-primary/[0.12]" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/10 bg-primary/[0.08] text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" strokeWidth={2.1} />
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/70 text-muted-foreground opacity-70 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:opacity-100">
                    <ArrowUpLeft className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-black tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
                    {item.title}
                  </h3>

                  <p className="mt-2 max-w-[260px] text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <div className="mt-auto pt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary">
                    {item.label}

                    <span className="transition-transform duration-200 group-hover:-translate-x-1">
                      ←
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
