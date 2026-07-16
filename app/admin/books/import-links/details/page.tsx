import { requireAdmin } from "@/lib/admin/permissions";
import IranKetabPreviewClient from "../IranKetabPreviewClient";

export const dynamic = "force-dynamic";

export default async function IranKetabImportDetailsPage() {
  await requireAdmin();
  return <IranKetabPreviewClient view="details" />;
}
