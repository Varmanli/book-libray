import type { MetadataRoute } from "next";

/**
 * Phase 1 PWA metadata. This uses Next.js's manifest route so the browser
 * receives a single, versioned manifest without a second hand-maintained copy
 * in `public`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "قفسه",
    short_name: "قفسه",
    description: "مدیریت کتابخانه شخصی و لیست خرید کتاب",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#141816",
    theme_color: "#2b6252",
    lang: "fa",
    dir: "rtl",
    categories: ["books", "education", "productivity"],
    icons: [
      {
        src: "/icons/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
