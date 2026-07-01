import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// اگر DATABASE_URL تنظیم نشده باشد، pg با خطای مبهم SASL کرش می‌کند؛
// این بررسی یک پیام واضح برای توسعه‌دهنده می‌دهد.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "[db] متغیر محیطی DATABASE_URL تنظیم نشده است. " +
      "رشته‌ی اتصال PostgreSQL را در فایل .env قرار دهید (نمونه را در .env.example ببینید)."
  );
}

// ساخت یک connection pool به PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// اتصال Drizzle به دیتابیس با schema
export const db = drizzle(pool, { schema });

// اگه جایی لازم داشتی raw query بزنی
export { pool };
