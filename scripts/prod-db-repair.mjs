import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required for production database repair.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const statements = [
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "source_edition_code" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "cover_filename" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "cover_image" text',
];

try {
  await pool.query("select 1");

  const tableCheck = await pool.query(
    "select to_regclass($1) as table_name",
    ['"BookEdition"']
  );

  if (!tableCheck.rows[0]?.table_name) {
    throw new Error('Required table "BookEdition" does not exist.');
  }

  for (const statement of statements) {
    await pool.query(statement);
  }

  console.log("Production database repair completed.");
} finally {
  await pool.end();
}
