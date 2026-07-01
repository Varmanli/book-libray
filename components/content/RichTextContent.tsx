import { sanitizeRichTextHtml } from "@/lib/content/rich-text";

export default function RichTextContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const html = sanitizeRichTextHtml(content);

  return (
    <div
      className={
        className ??
        "space-y-4 [&_a]:text-primary [&_a]:underline [&_blockquote]:rounded-[1.2rem] [&_blockquote]:border-r-2 [&_blockquote]:border-primary/35 [&_blockquote]:bg-primary/8 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_h2]:text-xl [&_h2]:font-black [&_h3]:text-lg [&_h3]:font-black [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pr-6 [&_p]:leading-8 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pr-6"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
