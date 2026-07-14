import { NextRequest } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { apiSuccess } from "@/lib/api/response";
import { listImportSessions } from "@/lib/importers/iranketab/session";
import { parseImportHistoryQuery } from "@/lib/importers/iranketab/history-query";
export async function GET(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  return apiSuccess(
    await listImportSessions(parseImportHistoryQuery(req.nextUrl.searchParams)),
  );
}
