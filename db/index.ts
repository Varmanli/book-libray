import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// ساخت یک connection pool به PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// اتصال Drizzle به دیتابیس با schema
export const db = drizzle(pool, { schema });

// اگه جایی لازم داشتی raw query بزنی
export { pool };
