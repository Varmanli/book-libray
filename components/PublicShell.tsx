import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

/**
 * Server shell for public pages (homepage, book, profile…). Fetches the session
 * once and passes serializable user data to the client `SiteHeader`, then frames
 * the page with the shared header + footer. Keeps every public page on one shell
 * without duplicating header/footer markup.
 */
export default async function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
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
    </div>
  );
}
