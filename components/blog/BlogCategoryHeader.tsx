import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import BlogSearchForm from "@/components/blog/BlogSearchForm";

export default function BlogCategoryHeader({
  name,
  description,
  slug,
  q = "",
  searchAction = "/blog",
}: {
  name: string;
  description?: string | null;
  slug: string;
  q?: string;
  searchAction?: string;
}) {
  return (
    <header className="mt-6 mb-8 sm:mt-10 sm:mb-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"
      >
        بازگشت به مجله
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>

      <div className="mt-6 border-r-4 border-primary pr-5">
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
          {name}
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
          {description ||
            "مقاله‌ها، معرفی‌ها و نوشته‌های مرتبط با این موضوع را در این قفسه دنبال کنید."}
        </p>
      </div>

      <div className="mt-6 max-w-xl">
        <BlogSearchForm q={q} category={slug} action={searchAction} compact />
      </div>
    </header>
  );
}
