import jwt, { SignOptions } from "jsonwebtoken";
import { TOKEN_TTL_SECONDS } from "@/lib/auth/constants";

/**
 * Reads the JWT secret lazily so that a missing env var produces a clear,
 * developer-friendly error *when auth is actually used* instead of crashing
 * the whole app at import/build time.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error(
      "[auth] متغیر محیطی JWT_SECRET تنظیم نشده یا خیلی کوتاه است. " +
        "یک مقدار تصادفی و امن (حداقل ۳۲ کاراکتر) در فایل .env قرار دهید. " +
        "نمونه را در .env.example ببینید."
    );
  }

  return secret;
}

export interface AuthTokenPayload {
  /** شناسه کاربر */
  id: string;
  sessionVersion: number;
}

export function signJwt(payload: AuthTokenPayload): string {
  const options: SignOptions = { expiresIn: TOKEN_TTL_SECONDS };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyJwt(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === "object" && decoded && "id" in decoded) {
      const raw = decoded as { id: unknown; sessionVersion?: unknown };
      return {
        id: String(raw.id),
        sessionVersion: Number(raw.sessionVersion ?? 0),
      };
    }
    return null;
  } catch {
    return null;
  }
}
