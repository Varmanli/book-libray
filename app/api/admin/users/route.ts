import { NextRequest } from "next/server";

import { apiSuccess } from "@/lib/api/response";
import { assertAdminApi } from "@/lib/admin/permissions";
import { adminListUsers } from "@/lib/admin/service";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const roleParam = sp.get("role");
  const role = roleParam === "ADMIN" || roleParam === "USER" ? roleParam : undefined;

  const { users, total } = await adminListUsers({
    q: sp.get("q") ?? undefined,
    role,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return apiSuccess({
    users,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
