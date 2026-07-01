import { eq } from "drizzle-orm";

import { db } from "@/db";
import { Book } from "@/db/schema";

export async function findBookRouteCandidate(id: string) {
  const [book] = await db
    .select({ id: Book.id })
    .from(Book)
    .where(eq(Book.id, id))
    .limit(1);

  return book ?? null;
}
