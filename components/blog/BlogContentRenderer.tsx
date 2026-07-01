import RichTextContent from "@/components/content/RichTextContent";

export default function BlogContentRenderer({ content }: { content: string }) {
  return (
    <RichTextContent
      content={content}
      className="space-y-6 text-start text-[15px] leading-9 text-foreground/90 [&_a]:font-bold [&_blockquote]:my-6 [&_blockquote]:shadow-[0_18px_50px_-40px_rgba(0,0,0,0.75)] [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:leading-tight [&_h3]:mt-8 [&_h3]:text-xl [&_ol]:space-y-3 [&_p]:leading-9 [&_ul]:space-y-3"
    />
  );
}
