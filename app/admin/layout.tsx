import "../globals.css";

import { requireAdmin } from "@/lib/admin/permissions";
import AdminShell from "@/components/admin/AdminShell";
import { getSiteSettings } from "@/lib/settings/service";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <AdminShell
      user={{ name: user.name, username: user.username, image: user.image }}
      branding={{ logoUrl: settings.logoUrl, siteName: settings.siteName }}
    >
      {children}
    </AdminShell>
  );
}
