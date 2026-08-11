"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type BrandLogoSize = "header" | "footer" | "mobile" | "auth" | "admin";

interface BrandLogoProps {
  logoUrl?: string | null;
  siteName?: string | null;
  size?: BrandLogoSize;

  showName?: boolean;

  className?: string;
  logoClassName?: string;
  nameClassName?: string;
  fallbackClassName?: string;
}

const sizeClasses: Record<BrandLogoSize, string> = {
  header: "h-9 w-auto max-w-36",
  footer: "h-9 w-auto max-w-36",
  mobile: "h-7 w-auto max-w-[92px]",
  auth: "h-14 w-auto max-w-56",
  admin: "h-8 w-auto max-w-28",
};

const nameSizeClasses: Record<BrandLogoSize, string> = {
  header: "text-lg",
  footer: "text-lg",
  mobile: "text-sm",
  auth: "text-2xl",
  admin: "text-sm",
};

export function BrandLogo({
  logoUrl,
  siteName,
  size = "header",
  showName = false,
  className,
  logoClassName,
  nameClassName,
  fallbackClassName,
}: BrandLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const name = siteName?.trim() || "قفسه";
  const resolvedLogo = logoUrl?.trim() || "/logo.svg";

  const showImage = !imageFailed && Boolean(resolvedLogo);

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          `
            relative inline-flex shrink-0
            items-center justify-center
            overflow-hidden
          `,
          sizeClasses[size],
          fallbackClassName,
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedLogo}
            alt={`لوگوی ${name}`}
            onError={() => setImageFailed(true)}
            className={cn(
              `
                block h-full w-auto
                max-w-full object-contain
                select-none
              `,
              logoClassName,
            )}
            draggable={false}
          />
        ) : (
          <span
            aria-label={name}
            className={cn(
              `
                flex size-full
                items-center justify-center
                rounded-xl
                bg-primary/10
                px-3
                font-black
                text-primary
              `,
              nameSizeClasses[size],
            )}
          >
            {name}
          </span>
        )}
      </span>

      {showName ? (
        <span
          className={cn(
            `
              min-w-0 truncate
              font-black tracking-tight
              text-foreground
            `,
            nameSizeClasses[size],
            nameClassName,
          )}
        >
          {name}
        </span>
      ) : null}
    </span>
  );
}
