"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const PLACEHOLDER_COVER = "/placeholder-cover.svg";

export function shouldBypassImageOptimizer(src: string): boolean {
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolvedSrc = useMemo(() => {
    const value = src?.trim();
    if (!value || failed) return PLACEHOLDER_COVER;
    return value;
  }, [failed, src]);

  const bypassOptimizer = useMemo(
    () => shouldBypassImageOptimizer(resolvedSrc),
    [resolvedSrc],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && bypassOptimizer) {
      console.debug("[book-cover-image]", {
        src: resolvedSrc,
        bypassOptimizer: true,
      });
    }
  }, [bypassOptimizer, resolvedSrc]);

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
      onError={() => setFailed(true)}
    />
  );
}
