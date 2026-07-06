import { eq } from "drizzle-orm";

import { db } from "@/db";
import { ReferenceItem } from "@/db/schema";
import { adminCreateReference } from "@/lib/reference/service";
import { splitStoredGenres } from "@/lib/book/genres";

async function main() {
  const rows = await db
    .select({
      id: ReferenceItem.id,
      name: ReferenceItem.name,
      status: ReferenceItem.status,
    })
    .from(ReferenceItem)
    .where(eq(ReferenceItem.type, "GENRE"));

  const suspicious = rows.filter((row) => splitStoredGenres(row.name).length > 1);

  if (suspicious.length === 0) {
    console.log("No joined genre reference items found.");
    return;
  }

  console.log(`Found ${suspicious.length} suspicious joined genre reference items.`);

  for (const row of suspicious) {
    const parts = splitStoredGenres(row.name);
    console.log(`Repairing "${row.name}" -> ${parts.join(" | ")}`);

    for (const part of parts) {
      await adminCreateReference("GENRE", part);
    }

    await db
      .update(ReferenceItem)
      .set({
        status: "REJECTED",
        description: "Auto-archived because this joined genre entry was split into separate items.",
        updatedAt: new Date(),
      })
      .where(eq(ReferenceItem.id, row.id));
  }

  console.log("Joined genre reference repair completed.");
}

main().catch((error) => {
  console.error("repair-joined-genre-references failed:", error);
  process.exit(1);
});
