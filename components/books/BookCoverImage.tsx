import Image from "next/image";

import { normalizeMediaUrl } from "@/lib/book/cover";

const PLACEHOLDER_COVER = "/placeholder-cover.svg";

export function shouldBypassImageOptimizer(src: string | null | undefined): boolean {
  if (!src) return false;
  try {
    const url = new URL(src);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname.endsWith(".arvanstorage.ir") ||
      hostname.endsWith(".liara.space") ||
      hostname.includes("s3.ir-thr-at1")
    );
  } catch {
    return false;
  }
}

type BookCoverImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
};

export default function BookCoverImage({
  src,
  alt,
  className,
  width,
  height,
  fill = false,
  priority = false,
  sizes,
}: BookCoverImageProps) {
  const resolvedSrc = normalizeMediaUrl(src) ?? PLACEHOLDER_COVER;
  const bypassOptimizer = shouldBypassImageOptimizer(resolvedSrc);

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      unoptimized={bypassOptimizer}
    />
  );
}
