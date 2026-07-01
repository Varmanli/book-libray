import { Newspaper } from "lucide-react";

import BlogCard from "@/components/blog/BlogCard";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import type { HomeBlogPostPreview } from "@/lib/home/service";

export default function HomeBlogPreview({
  posts,
}: {
  posts: HomeBlogPostPreview[];
}) {
  return (
    <section>
      <HomeSectionHeader icon={Newspaper} title="آخرین نوشته‌ها" />

      {posts.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.6rem] border border-dashed border-border bg-card/75 px-5 py-8 text-center text-sm leading-7 text-muted-foreground">
          هنوز نوشته منتشرشده‌ای برای نمایش در صفحه اصلی وجود ندارد.
        </div>
      )}
    </section>
  );
}
