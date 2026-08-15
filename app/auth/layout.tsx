import "../globals.css";
import { AuthLayout as AuthShell } from "@/components/auth/AuthLayout";
import { getSiteSettings } from "@/lib/settings/service";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return (
    <AuthShell
      branding={{
        logoUrl: settings.logoUrl,
        logoLightUrl: settings.logoLightUrl,
        logoDarkUrl: settings.logoDarkUrl,
        siteName: settings.siteName,
      }}
    >
      {children}
    </AuthShell>
  );
}
