import { backfillMissingUsernames } from "@/lib/profile/username";

async function main() {
  const result = await backfillMissingUsernames();
  console.log(
    `Username backfill complete. Updated ${result.updatedCount} user(s). Scanned ${result.scannedCount} missing username record(s).`
  );
}

main().catch((error) => {
  console.error("Username backfill failed:", error);
  process.exit(1);
});
