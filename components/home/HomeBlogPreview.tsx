import { Newspaper } from "lucide-react";

import BlogCard from "@/components/blog/BlogCard";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import type { HomeBlogPostPreview } from "@/lib/home/service";

export default function HomeBlogPreview({
  posts,
}: {
  posts: HomeBlogPostPreview[];
}) {
  if (!posts.length) return null;
  return (
    <section>
      <HomeSectionHeader
        icon={Newspaper}
        title="از مجله قفسه"
        href="/blog"
        linkLabel="مشاهده مجله"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
