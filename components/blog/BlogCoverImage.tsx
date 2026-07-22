import BookCoverImage from "@/components/books/BookCoverImage";

const BLOG_FALLBACK = "/placeholder-cover.svg";

/** Shared blog banner renderer with the same Arvan-safe image path as covers. */
export default function BlogCoverImage({
  src,
  alt,
  priority = false,
  sizes,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  return (
    <BookCoverImage
      src={src || BLOG_FALLBACK}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}
