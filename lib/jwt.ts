import jwt, { SignOptions } from "jsonwebtoken";

// چک می‌کنیم secret موجوده
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET در .env تعریف نشده");
}
const JWT_SECRET: string = process.env.JWT_SECRET;

export function signJwt(payload: object): string {
  const options: SignOptions = {
    expiresIn: 7 * 24 * 60 * 60,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
