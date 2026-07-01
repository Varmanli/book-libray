"use client";

import { useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";

export default function AuthorAvatar({
  name,
  image,
  sizeClassName = "h-20 w-20",
  textClassName = "text-2xl",
  iconClassName = "h-8 w-8",
  className = "",
}: {
  name: string;
  image: string | null;
  sizeClassName?: string;
  textClassName?: string;
  iconClassName?: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = name.trim().charAt(0) || "ن";
  const showImage = !!image && !imgError;

  return (
    <div
      className={`relative overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/15 ${sizeClassName} ${className}`}
    >
      {showImage ? (
        <Image
          src={image as string}
          alt={name}
          fill
          sizes="128px"
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-primary">
          {initial ? (
            <span className={`font-black ${textClassName}`}>{initial}</span>
          ) : (
            <UserRound className={iconClassName} />
          )}
        </div>
      )}
    </div>
  );
}
