import type { NextConfig } from "next";

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
export default nextConfig;
