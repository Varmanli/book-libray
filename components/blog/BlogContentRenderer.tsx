import BlogBookEmbed from "@/components/blog/BlogBookEmbed";
import RichTextContent from "@/components/content/RichTextContent";
import {
  resolveBlogBookEmbeds,
  splitBlogContentByEmbeds,
} from "@/lib/blog/book-embed";

export default async function BlogContentRenderer({ content }: { content: string }) {
  const parts = splitBlogContentByEmbeds(content);
  const booksById = await resolveBlogBookEmbeds(
    parts
      .filter((part): part is Extract<(typeof parts)[number], { type: "bookEmbed" }> => part.type === "bookEmbed")
      .map((part) => part.bookId),
  );

  return (
    <div className="text-start text-[16px] text-foreground/90 sm:text-[17px]">
      {parts.map((part, index) =>
        part.type === "html" ? (
          <RichTextContent
            key={`html-${index}`}
            content={part.html}
            className="magazine-rich-text [&_a]:font-bold [&_blockquote]:shadow-[0_18px_50px_-40px_rgba(0,0,0,0.45)] [&_h2]:text-2xl [&_h3]:text-xl"
          />
        ) : (
          <BlogBookEmbed key={`${part.bookId}-${index}`} book={booksById.get(part.bookId) ?? null} />
        ),
      )}
    </div>
  );
}
