import BlogCard from "@/components/blog/BlogCard";
import type { PublicBlogPostPreview } from "@/lib/blog/service";

export default function RelatedMagazineArticles({ posts, title = "از مجله قفسه", description }: { posts: PublicBlogPostPreview[]; title?: string; description?: string }) {
  if (!posts.length) return null;
  return <section className="mt-10 lg:mt-12" aria-labelledby="magazine-articles"><div className="mb-5"><h2 id="magazine-articles" className="text-2xl font-black text-foreground">{title}</h2>{description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}</div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{posts.map((post) => <BlogCard key={post.id} post={post} />)}</div></section>;
}
