"use client";

import { useEffect, useState } from "react";

const BUILTIN_MAP: Record<string, string> = {
  "bg-1": "/quotebg/bg-1.webp",
  "bg-2": "/quotebg/bg-2.webp",
  "bg-3": "/quotebg/bg-3.webp",
  "bg-4": "/quotebg/bg-4.webp",
  "bg-5": "/quotebg/bg-5.webp",
  "bg-6": "/quotebg/bg-6.webp",
  "bg-7": "/quotebg/bg-7.webp",
  "bg-8": "/quotebg/bg-8.webp",
  "bg-9": "/quotebg/bg-9.webp",
  "bg-10": "/quotebg/bg-10.webp",
  "bg-11": "/quotebg/bg-11.webp",
  "bg-12": "/quotebg/bg-12.webp",
};

let backgroundMapCache: Record<string, string> | null = null;
let backgroundFetchPromise: Promise<Record<string, string>> | null = null;

export function getCachedQuoteBackgroundImage(variant?: string | null): string | null {
  if (!variant || variant === "default") return null;

  if (backgroundMapCache) {
    return backgroundMapCache[variant] || BUILTIN_MAP[variant] || null;
  }

  return BUILTIN_MAP[variant] || null;
}

export function fetchQuoteBackgroundMap(): Promise<Record<string, string>> {
  if (backgroundMapCache) return Promise.resolve(backgroundMapCache);
  if (backgroundFetchPromise) return backgroundFetchPromise;

  backgroundFetchPromise = fetch("/api/quotes/backgrounds")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const map: Record<string, string> = { ...BUILTIN_MAP };
      if (data?.backgrounds && Array.isArray(data.backgrounds)) {
        for (const bg of data.backgrounds) {
          if (bg.value && bg.image) {
            map[bg.value] = bg.image;
          }
        }
      }
      backgroundMapCache = map;
      return map;
    })
    .catch(() => {
      backgroundMapCache = { ...BUILTIN_MAP };
      return backgroundMapCache;
    })
    .finally(() => {
      backgroundFetchPromise = null;
    });

  return backgroundFetchPromise;
}

export function useQuoteBackgroundImage(variant?: string | null): string | null {
  const [imageSrc, setImageSrc] = useState<string | null>(() =>
    getCachedQuoteBackgroundImage(variant),
  );

  useEffect(() => {
    if (!variant || variant === "default") {
      setImageSrc(null);
      return;
    }

    const cached = getCachedQuoteBackgroundImage(variant);
    if (cached) {
      setImageSrc(cached);
    }

    if (!BUILTIN_MAP[variant] && !backgroundMapCache) {
      let isMounted = true;
      fetchQuoteBackgroundMap().then((map) => {
        if (isMounted) {
          setImageSrc(map[variant] || null);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [variant]);

  return imageSrc;
}
