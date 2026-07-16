import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicQuotesByUsername } from "@/lib/quotes/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const search = request.nextUrl.searchParams;
  const viewer = await getCurrentUser();
  const result = await getPublicQuotesByUsername(username, viewer?.id, {
    limit: Number(search.get("limit") || 10),
    offset: Number(search.get("offset") || 0),
  });
  return Response.json(result);
}
