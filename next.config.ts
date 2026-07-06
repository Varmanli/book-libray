import type { NextConfig } from "next";
import withPWA from "next-pwa";

/**
 * هاست‌های مجاز برای next/image. هاست مربوط به باکت آبجکت‌استوریج را از روی
 * S3_PUBLIC_BASE_URL استخراج می‌کنیم تا با تغییر باکت/دامنه نیازی به ویرایش
 * دستی نباشد. هاست فعلی هم به‌عنوان fallback نگه داشته می‌شود.
 */
function resolveImageHosts(): string[] {
  const hosts = new Set<string>([
    "qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir",
    "www.iranketab.ir",
    "iranketab.ir",
  ]);

  const base = process.env.S3_PUBLIC_BASE_URL;

  if (base) {
    try {
      hosts.add(new URL(base).hostname);
    } catch {
      // اگر مقدار نامعتبر بود، فقط fallback استفاده می‌شود.
    }
  }

  return [...hosts];
}

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      ...resolveImageHosts().map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/**",
      })),

      // Explicit IranKetab patterns برای اطمینان بیشتر
      {
        protocol: "https",
        hostname: "www.iranketab.ir",
        pathname: "/Images/ProductImages/**",
      },
      {
        protocol: "https",
        hostname: "iranketab.ir",
        pathname: "/Images/ProductImages/**",
      },
    ],
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "gstatic-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-font-assets",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-image",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-js-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-style-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
    {
      urlPattern:
        /^https:\/\/qafaseh-prod\.s3\.ir-thr-at1\.arvanstorage\.ir\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "arvan-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // Optional cache for IranKetab images
    {
      urlPattern:
        /^https:\/\/(?:www\.)?iranketab\.ir\/Images\/ProductImages\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "iranketab-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

export default pwaConfig(nextConfig as any);
