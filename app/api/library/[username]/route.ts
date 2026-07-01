import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { getLibraryByUsername } from "@/lib/library/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const result = await getLibraryByUsername(username, viewer?.id);

  if (!result.found) {
    return apiError("کاربر یافت نشد", 404, "USER_NOT_FOUND");
  }

  return apiSuccess({ result });
}
