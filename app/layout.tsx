import "./globals.css";
import { Toaster } from "react-hot-toast";
import PerformanceMonitor from "@/components/PerformanceMonitor";

export const metadata = {
  title: "قفسه",
  description:
    "قفسه جایی برای کتابخون‌های جدی. کتاب‌هایت را اضافه کن، وضعیت خوندنت را مشخص کن، یادداشت‌ها و هایلایت‌هایت را کنار خودت داشته باش و لیست خرید بعدی بساز تا هیچ کتاب خوبی را از دست ندهی.",
  icons: {
    icon: "/faveicon.png",
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
        <Toaster position="top-right" />
        <PerformanceMonitor />
      </body>
    </html>
  );
}
