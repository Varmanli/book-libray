import { Newspaper } from "lucide-react";

import BlogCard from "@/components/blog/BlogCard";
import type { PublicBlogPostPreview } from "@/lib/blog/service";

export default function RelatedMagazineArticles({
  posts,
  title = "ادامه مطالعه در مجله قفسه",
}: {
  posts: PublicBlogPostPreview[];
  title?: string;
}) {
  if (!posts.length) return null;

  return (
    <section
      className="
        mt-14
      "
      aria-labelledby="related-magazine-articles"
    >
      <div className="mb-6">
        <h2
          id="related-magazine-articles"
          className="
            flex
            items-center
            gap-2.5
            text-xl
            font-black
            text-foreground
          "
        >
          <span
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-xl
              bg-primary/10
              text-primary
            "
          >
            <Newspaper className="h-4 w-4" />
          </span>

          {title}
        </h2>
      </div>

      <div
        className="
          grid
          gap-5
          md:grid-cols-2
          xl:grid-cols-3
        "
      >
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
