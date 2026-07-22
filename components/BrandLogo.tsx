"use client";

import { useEffect, useState } from "react";
import { FaBookOpen } from "react-icons/fa";

import { cn } from "@/lib/utils";

type BrandLogoSize = "header" | "footer" | "mobile" | "auth" | "admin";

const sizeClasses: Record<BrandLogoSize, { container: string; icon: string; text: string }> = {
  header: { container: "h-10 w-10 rounded-2xl", icon: "h-4 w-4", text: "text-xl" },
  footer: { container: "h-10 w-10 rounded-2xl", icon: "h-4 w-4", text: "text-xl" },
  mobile: { container: "h-9 w-9 rounded-xl", icon: "h-4 w-4", text: "text-lg" },
  auth: { container: "h-12 w-12 rounded-2xl", icon: "h-5 w-5", text: "text-2xl" },
  admin: { container: "h-8 w-8 rounded-xl", icon: "h-4 w-4", text: "text-base" },
};

export function BrandLogo({
  logoUrl,
  siteName,
  size = "header",
  showName = true,
  className,
  logoClassName,
  nameClassName,
  fallbackClassName,
}: {
  logoUrl?: string | null;
  siteName?: string | null;
  size?: BrandLogoSize;
  showName?: boolean;
  className?: string;
  logoClassName?: string;
  nameClassName?: string;
  fallbackClassName?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = logoUrl?.trim() ?? "";
  const name = siteName?.trim() || "قفسه";
  const sizes = sizeClasses[size];

  useEffect(() => setImageFailed(false), [imageUrl]);

  const showUploadedLogo = Boolean(imageUrl) && !imageFailed;

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden",
          sizes.container,
          showUploadedLogo
            ? "bg-transparent"
            : "inline-flex items-center justify-center border border-border/80 bg-primary/12 text-primary shadow-sm shadow-black/5",
          fallbackClassName,
        )}
      >
        {showUploadedLogo ? (
          // The admin setting may point to a valid external URL outside Next's
          // image allowlist; a native image keeps this runtime-configured asset
          // from failing at render time while retaining the error fallback.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${name} logo`}
            className={cn("h-full w-full object-contain", logoClassName)}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <FaBookOpen aria-hidden="true" className={sizes.icon} />
        )}
      </span>
      {showName ? (
        <span
          className={cn(
            "font-extrabold tracking-tight text-foreground",
            sizes.text,
            nameClassName,
          )}
        >
          {name}
        </span>
      ) : null}
    </span>
  );
}
