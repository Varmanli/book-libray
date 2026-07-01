"use client";

import { useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * چیپ فشرده‌ی نویسنده/مترجم با آواتار دایره‌ای. اگر تصویر نبود یا خطا داد، حرف
 * اول نام به‌جای آیکن شکسته نمایش داده می‌شود. در صورت وجود href، کل چیپ لینک است.
 */
export default function ReferenceChip({
  name,
  href,
  image,
  size = "md",
}: {
  name: string;
  href?: string | null;
  image?: string | null;
  size?: "sm" | "md";
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!image && !imgError;
  const initial = name.trim().charAt(0) || "؟";

  const avatarSize = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const chipClass = cn(
    "inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-card/55 py-1 pe-3 ps-1 font-medium text-foreground backdrop-blur-md transition-colors",
    href && "hover:border-primary/30 hover:bg-card/75 hover:text-primary",
    textSize
  );

  const inner = (
    <>
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-[11px] font-bold text-muted-foreground",
          avatarSize
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image as string}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </span>

      <span className="truncate">{name}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={chipClass}>
        {inner}
      </Link>
    );
  }
  return <div className={chipClass}>{inner}</div>;
}
