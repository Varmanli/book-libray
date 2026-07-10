import "./globals.css";
import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import { getSiteMetadataBase } from "@/lib/seo/site";
import { getSiteSettings } from "@/lib/settings/service";

// Site branding, including the favicon, is admin-configured at runtime.
// Metadata must therefore be regenerated after settings invalidation instead of
// being frozen into the build alongside the starter favicon.
export const dynamic = "force-dynamic";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2B6252",
};

// یک نسخه‌ی پایدار (هشِ کوتاه) از روی URL برای کش‌شکنیِ فاوآیکون می‌سازد.
// چون URLِ آپلودِ تازه یکتاست، این مقدار با هر آپلود تغییر می‌کند.
function withVersion(url: string): string {
  if (!url) return url;
  let hash = 5381;
  for (let i = 0; i < url.length; i++) hash = (hash * 33) ^ url.charCodeAt(i);
  const v = (hash >>> 0).toString(36);
  return url.includes("?") ? `${url}&v=${v}` : `${url}?v=${v}`;
}

function faviconType(url: string): string | undefined {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".webp")) return "image/webp";
  return undefined;
}

function isUsableFaviconUrl(url: string): boolean {
  // Optimizer URLs and production-local uploads are not durable favicon
  // sources. Production uploads always return an S3 public URL.
  if (/^\/?_next\/image(?:\?|\/|$)/i.test(url)) return false;
  if (process.env.NODE_ENV === "production" && /^\/uploads\//i.test(url)) {
    return false;
  }
  return true;
}

// متادیتا از تنظیمات سایت (قابل‌ویرایش در /admin/settings) ساخته می‌شود؛
// مقادیر خالی به پیش‌فرض برمی‌گردند.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();

  const title = s.seoTitle || s.siteName || "قفسه - کتابخانه شخصی";
  const description =
    s.seoDescription ||
    s.siteDescription ||
    "قفسه جایی برای کتابخون‌های جدی. کتاب‌هایت را اضافه کن، وضعیت خوندنت را مشخص کن، یادداشت‌ها و هایلایت‌هایت را کنار خودت داشته باش و لیست خرید بعدی بساز تا هیچ کتاب خوبی را از دست ندهی.";
  const siteName = s.siteName || "قفسه";
  const ogImage = s.ogImageUrl || "/og-image.png";

  // A custom favicon must be the *only* icon candidate. Keeping /favicon.ico
  // beside it lets browsers prefer the stale static file over the uploaded
  // asset. The stable URL hash busts aggressive browser favicon caches.
  const favicon = s.faviconUrl && isUsableFaviconUrl(s.faviconUrl)
    ? withVersion(s.faviconUrl)
    : null;
  const icons: Metadata["icons"] = favicon
    ? {
        icon: [{ url: favicon, type: faviconType(favicon) }],
        shortcut: favicon,
        apple: favicon,
      }
    : {
        icon: [
          { url: "/favicon.ico", sizes: "any" },
          { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
          { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
        apple: [
          { url: "/icons/icon-152x152.svg", sizes: "152x152", type: "image/svg+xml" },
        ],
      };

  return {
    title,
    description,
    keywords: [
      "کتاب",
      "کتابخانه",
      "خواندن",
      "مدیریت کتاب",
      "لیست خرید",
      "آمار مطالعه",
    ],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: { email: false, address: false, telephone: false },
    metadataBase: getSiteMetadataBase(),
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url: "/",
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
      locale: "fa_IR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons,
    other: {
      "application-name": siteName,
      "msapplication-TileColor": "#2B6252",
      "msapplication-config": "/browserconfig.xml",
    },
  };
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@latest/dist/font-face.css"
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
