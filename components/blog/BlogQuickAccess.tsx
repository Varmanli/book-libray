import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Feather,
  LibraryBig,
  Sparkles,
} from "lucide-react";

type BlogQuickAccessCategory = {
  slug: string;
  name: string;
  description?: string | null;
};

const categoryIcons = [BookOpen, LibraryBig, Feather, Sparkles];

function BlogQuickAccess({
  categories = [],
}: {
  categories?: BlogQuickAccessCategory[];
}) {
  const visibleCategories = categories.slice(0, 4);

  if (!visibleCategories.length) return null;

  return (
    <section className="mt-6 lg:mt-8" aria-labelledby="blog-quick-access-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-primary">مسیرهای پیشنهادی</p>

          <h2
            id="blog-quick-access-title"
            className="mt-1 text-xl font-black tracking-tight text-foreground sm:text-2xl"
          >
            دسترسی سریع
          </h2>
        </div>

        <Link
          href="/blog"
          className="group hidden items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary sm:inline-flex"
        >
          همه نوشته‌ها
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          {visibleCategories.map((category, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];

            return (
              <Link
                key={category.slug}
                href={`/blog/category/${encodeURIComponent(category.slug)}`}
                className="group relative flex min-h-[116px] items-center gap-4 border-b border-border/50 px-5 py-5 transition-colors duration-200 hover:bg-muted/35 sm:border-l lg:border-b-0 lg:last:border-l-0"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/50 text-muted-foreground transition-all duration-200 group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black leading-6 text-foreground transition-colors group-hover:text-primary">
                    {category.name}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                    {category.description ||
                      `مطالب مجله قفسه درباره ${category.name}`}
                  </p>
                </div>

                <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:-translate-x-1 group-hover:text-primary" />

                <span className="absolute inset-x-5 bottom-0 h-px origin-right scale-x-0 bg-primary/50 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            );
          })}
        </div>
      </div>

      <Link
        href="/blog"
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-border/60 py-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground sm:hidden"
      >
        مشاهده همه نوشته‌ها
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

export default BlogQuickAccess;
