"use client";

import { type ReactNode, useState } from "react";

/**
 * آواتار دایره‌ای کوچک برای کارت متادیتا (مثل مترجم). در نبود تصویر یا خطای
 * بارگذاری، حرف اول نام یا آیکن جایگزین نمایش داده می‌شود (نه آیکن شکسته).
 */
export default function MetaAvatar({
  image,
  name,
  fallback,
}: {
  image?: string | null;
  name?: string | null;
  fallback?: ReactNode;
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!image && !imgError;
  const initial = name?.trim().charAt(0);

  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary ring-1 ring-primary/15 [&_svg]:h-3 [&_svg]:w-3">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image as string}
          alt={name ?? ""}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : initial ? (
        <span className="text-[10px] font-bold">{initial}</span>
      ) : (
        fallback
      )}
    </span>
  );
}
