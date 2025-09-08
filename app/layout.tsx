import "./globals.css";
import { NextAuthProvider } from "./providers/SessionProviderClient";

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
    <html lang="fa">
      <body>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
