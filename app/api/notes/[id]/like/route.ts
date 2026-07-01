import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { togglePublishedNoteLike } from "@/lib/notes/service";

// POST: toggle the current user's like on a published note.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "برای پسندیدن باید وارد شوید" },
      { status: 401 }
    );
  }

  const result = await togglePublishedNoteLike(id, user.id);
  if (!result) {
    return NextResponse.json({ error: "یادداشت پیدا نشد" }, { status: 404 });
  }

  return NextResponse.json(result);
}
