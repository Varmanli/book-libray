import QafasehHeader from "@/component/Header";
import "./globals.css";

export const metadata = {
  title: "کتابخانه من",
  description: "کتابخانه شخصی با Next.js و NextAuth",
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
        <QafasehHeader />
        {children}
      </body>
    </html>
  );
}
