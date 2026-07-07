import "./globals.css";
import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import { getSiteMetadataBase } from "@/lib/seo/site";
import { getSiteSettings } from "@/lib/settings/service";

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

  // فاوآیکونِ سفارشی در صورت تنظیم، وگرنه فایلِ پیش‌فرض /favicon.ico و آیکون‌های PWA.
  // کش‌شکن: مرورگرها فاوآیکون را بسیار تهاجمی کش می‌کنند؛ یک پارامترِ نسخه بر اساس
  // خودِ URL اضافه می‌کنیم تا بعد از هر آپلودِ تازه قطعاً دوباره دریافت شود.
  const favicon = s.faviconUrl ? withVersion(s.faviconUrl) : null;
  const icons: Metadata["icons"] = favicon
    ? {
        icon: [{ url: favicon }, { url: "/favicon.ico", sizes: "any" }],
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
