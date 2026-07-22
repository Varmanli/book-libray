import "../globals.css";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { getSiteSettings } from "@/lib/settings/service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // اعتبارسنجی واقعی توکن و وجود کاربر در دیتابیس (محیط Node)
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }
  const settings = await getSiteSettings();
  const branding = { logoUrl: settings.logoUrl, siteName: settings.siteName };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
        }}
        isAdmin={isAdmin(user)}
        branding={branding}
      />
      <main className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <SiteFooter
        branding={branding}
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
        }}
      />
    </div>
  );
}
