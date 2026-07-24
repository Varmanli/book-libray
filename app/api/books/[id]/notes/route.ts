import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/book/detail-service";
import { getPublishedNotesForBook } from "@/lib/notes/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const search = request.nextUrl.searchParams;
  const viewer = await getCurrentUser();
  const ref = decodeURIComponent(id);
  const edition = search.get("edition") || null;
  const scope = (search.get("scope") as "book" | "edition" | null) || undefined;
  const limit = Number(search.get("limit") || 10);
  const offset = Number(search.get("offset") || 0);

  const detailResult = await getBookDetail(ref, viewer?.id, edition);
  if (!detailResult.found) {
    return Response.json({ error: "کتاب یافت نشد" }, { status: 404 });
  }

  const result = await getPublishedNotesForBook({
    catalogBookId: detailResult.book.id,
    viewerId: viewer?.id,
    editionId: edition,
    scope,
    limit,
    offset,
  });

  return Response.json(result);
}
