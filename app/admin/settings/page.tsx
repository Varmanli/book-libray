import { getSiteSettings } from "@/lib/settings/service";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return <SettingsForm initialSettings={settings} />;
}
