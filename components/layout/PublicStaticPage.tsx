import { notFound } from "next/navigation";

import PublicShell from "@/components/PublicShell";
import RichTextContent from "@/components/content/RichTextContent";
import { getStaticPageBySlug } from "@/lib/static-pages/service";

/**
 * Public static page — premium editorial layout
 */
export default async function PublicStaticPage({ slug }: { slug: string }) {
  const page = await getStaticPageBySlug(slug);
  if (!page) notFound();

  const hasContent = Boolean(page.content?.trim());

  return (
    <PublicShell>
      <main className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        {/* Soft background glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-2xl" />

        {/* Header */}
        <header className="relative text-center">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl leading-[1.2]">
            {page.title}
          </h1>

          {page.subtitle ? (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-9 text-muted-foreground">
              {page.subtitle}
            </p>
          ) : null}

          {/* decorative line */}
          <div className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
        </header>

        {/* Content Card */}
        <article className="relative mt-12 rounded-[2.2rem] border border-border/60 bg-card/40 px-6 py-10 shadow-[0_40px_120px_-90px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:px-10 sm:py-12">
          {/* inner glow */}
          <div className="pointer-events-none absolute inset-0 rounded-[2.2rem] bg-gradient-to-br from-white/5 via-transparent to-transparent" />

          {hasContent ? (
            <RichTextContent
              content={page.content}
              className="
                relative
                text-[15px] leading-9 text-foreground/90
                space-y-6

                [&_p]:leading-9 [&_p]:text-foreground/85

                [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-foreground
                [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground

                [&_a]:text-primary [&_a]:underline decoration-primary/30 hover:decoration-primary

                [&_blockquote]:mt-6 [&_blockquote]:rounded-2xl
                [&_blockquote]:border-r-2 [&_blockquote]:border-primary/30
                [&_blockquote]:bg-primary/5
                [&_blockquote]:px-5 [&_blockquote]:py-4
                [&_blockquote]:text-foreground/80

                [&_ul]:space-y-2 [&_ul]:pr-6 [&_ul]:list-disc
                [&_ol]:space-y-2 [&_ol]:pr-6 [&_ol]:list-decimal

                [&_li]:leading-8
              "
            />
          ) : (
            <p className="text-center text-sm leading-8 text-muted-foreground">
              محتوای این صفحه هنوز آماده نشده است.
            </p>
          )}
        </article>
      </main>
    </PublicShell>
  );
}
