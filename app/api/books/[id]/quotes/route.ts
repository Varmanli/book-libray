import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookQuotesPage } from "@/lib/book/detail-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const search = request.nextUrl.searchParams;
  const viewer = await getCurrentUser();
  const page = Number(search.get("page") || 1);

  const result = await getBookQuotesPage(
    decodeURIComponent(id),
    viewer?.id,
    page,
  );

  return Response.json(result);
}
