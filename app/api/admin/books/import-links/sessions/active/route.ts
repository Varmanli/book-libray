import { assertAdminApi } from "@/lib/admin/permissions";
import { apiSuccess } from "@/lib/api/response";
import { getRecoverableSession } from "@/lib/importers/iranketab/session";
export async function GET() {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  return apiSuccess({ session: await getRecoverableSession(gate.user.id) });
}
