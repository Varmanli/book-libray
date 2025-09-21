import "./globals.css";
import { Toaster } from "react-hot-toast";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00FF99",
};

export const metadata = {
  title: "قفسه - کتابخانه شخصی",
  description:
    "قفسه جایی برای کتابخون‌های جدی. کتاب‌هایت را اضافه کن، وضعیت خوندنت را مشخص کن، یادداشت‌ها و هایلایت‌هایت را کنار خودت داشته باش و لیست خرید بعدی بساز تا هیچ کتاب خوبی را از دست ندهی.",
  keywords: [
    "کتاب",
    "کتابخانه",
    "خواندن",
    "مدیریت کتاب",
    "لیست خرید",
    "آمار مطالعه",
  ],
  authors: [{ name: "قفسه" }],
  creator: "قفسه",
  publisher: "قفسه",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "قفسه - کتابخانه شخصی",
    description:
      "مدیریت کتابخانه شخصی و لیست خرید کتاب با آمار و نمودارهای جامع",
    url: "/",
    siteName: "قفسه",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "قفسه - کتابخانه شخصی",
      },
    ],
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "قفسه - کتابخانه شخصی",
    description:
      "مدیریت کتابخانه شخصی و لیست خرید کتاب با آمار و نمودارهای جامع",
    images: ["/og-image.png"],
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
  icons: {
    icon: [
      {
        url: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        url: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/icons/icon-152x152.svg",
        sizes: "152x152",
        type: "image/svg+xml",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "قفسه",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "قفسه",
    "msapplication-TileColor": "#00FF99",
    "msapplication-config": "/browserconfig.xml",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@latest/dist/font-face.css"
        />
      </head>
      <body>
        {children}
        <Toaster position="top-center" />
        <PerformanceMonitor />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
