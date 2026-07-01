/**
 * Ad-hoc verification for the `/books/[username]` lookup.
 *
 * Usage (DATABASE_URL must be set in the environment):
 *   npx tsx scripts/check-library-lookup.ts user_fnxsne
 *
 * Confirms that an existing username resolves to a library result (found: true)
 * — including the zero-books case, which must return `{ found: true, books: [] }`
 * rather than null/404.
 */
import { getLibraryByUsername } from "@/lib/library/service";

async function main() {
  const username = process.argv[2] ?? "user_fnxsne";
  console.log(`Looking up library for username: ${JSON.stringify(username)}`);

  // No viewerId → anonymous viewer (public/private rules apply).
  const result = await getLibraryByUsername(username);

  if (!result.found) {
    console.log("❌ found: false — no user matched this username.");
    process.exitCode = 1;
    return;
  }

  if (result.isPrivate) {
    console.log("✅ found: true, profile is PRIVATE (anonymous viewer).");
    console.log("   profile:", result.profile);
    return;
  }

  console.log("✅ found: true, profile is PUBLIC.");
  console.log("   username:", result.profile.username);
  console.log("   books:", result.books.length, "→ stats:", result.stats);
  console.log(
    result.books.length === 0
      ? "   (zero books → empty-state renders, NOT 404)"
      : "   (has books)"
  );
}

main()
  .catch((err) => {
    console.error("Lookup check failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(process.exitCode ?? 0));
