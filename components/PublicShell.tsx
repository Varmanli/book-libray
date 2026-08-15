import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import MobileNav from "@/components/layout/MobileNav";
import { getSiteSettings } from "@/lib/settings/service";
import PublicAnalyticsTracker from "@/components/analytics/PublicAnalyticsTracker";

/**
 * Server shell for public pages (homepage, book, profile…). Fetches the session
 * once and passes serializable user data to the client `SiteHeader`, then frames
 * the page with the shared header + footer. Keeps every public page on one shell
 * without duplicating header/footer markup.
 */
export default async function PublicShell({
  children,
  user: initialUser,
}: {
  children: React.ReactNode;
  user?: Awaited<ReturnType<typeof getCurrentUser>> | null;
}) {
  const user = initialUser === undefined ? await getCurrentUser() : initialUser;
  const settings = await getSiteSettings();
  const branding = { logoUrl: settings.logoUrl, siteName: settings.siteName };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <PublicAnalyticsTracker />
      <SiteHeader
        user={
          user
            ? {
                name: user.name,
                email: user.email,
                image: user.image,
                username: user.username,
              }
            : null
        }
        isAdmin={user ? isAdmin(user) : false}
        branding={branding}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        branding={branding}
        user={
          user
            ? {
                name: user.name,
                email: user.email,
                image: user.image,
                username: user.username,
              }
            : null
        }
      />
      <MobileNav />
    </div>
  );
}
