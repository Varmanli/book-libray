import BlogBookEmbed from "@/components/blog/BlogBookEmbed";
import RichTextContent from "@/components/content/RichTextContent";
import {
  resolveBlogBookEmbeds,
  splitBlogContentByEmbeds,
} from "@/lib/blog/book-embed";

export default async function BlogContentRenderer({
  content,
}: {
  content: string;
}) {
  const parts = splitBlogContentByEmbeds(content);
  const booksById = await resolveBlogBookEmbeds(
    parts
      .filter(
        (
          part,
        ): part is Extract<(typeof parts)[number], { type: "bookEmbed" }> =>
          part.type === "bookEmbed",
      )
      .map((part) => part.bookId),
  );

  return (
    <div className="text-start text-sm text-foreground/90 sm:text-base">
      {parts.map((part, index) =>
        part.type === "html" ? (
          <RichTextContent
            key={`html-${index}`}
            content={part.html}
            className="magazine-rich-text [&_a]:font-bold [&_blockquote]:shadow-[0_18px_50px_-40px_rgba(0,0,0,0.45)] [&_h2]:text-lg [&_h2]:sm:text-xl [&_h3]:text-base [&_h3]:sm:text-lg"
          />
        ) : (
          <BlogBookEmbed
            key={`${part.bookId}-${index}`}
            book={booksById.get(part.bookId) ?? null}
          />
        ),
      )}
    </div>
  );
}
