import { apiSuccess } from "@/lib/api/response";
import { assertAdminApi } from "@/lib/admin/permissions";
import { getAdminStaticPages } from "@/lib/static-pages/service";

export const runtime = "nodejs";

export async function GET() {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const pages = await getAdminStaticPages();
  return apiSuccess({ pages });
}
