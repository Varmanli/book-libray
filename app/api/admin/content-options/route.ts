import { NextRequest } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { adminContentOptions } from "@/lib/admin/user-content";
import { apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const gate = await assertAdminApi(); if ("error" in gate) return gate.error;
  const type = req.nextUrl.searchParams.get("type") === "books" ? "books" : "users";
  const options = await adminContentOptions(type, req.nextUrl.searchParams.get("q") ?? "", req.nextUrl.searchParams.get("userId") ?? undefined);
  return apiSuccess({ options });
}
