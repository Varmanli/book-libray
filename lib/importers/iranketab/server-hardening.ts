import { createHash } from "node:crypto";

export function canonicalIranKetabSourceIdentity(value: string): string {
  const url = new URL(value);
  const match = url.pathname
    .replace(/\/+$/, "")
    .match(/^\/book\/(\d+)(?:-|$)/i);
  if (
    !match ||
    !["iranketab.ir", "www.iranketab.ir"].includes(url.hostname.toLowerCase())
  )
    throw new Error("INVALID_SOURCE_URL");
  return `iranketab:book:${match[1]}`;
}

export function advisoryLockKey(identity: string): bigint {
  return createHash("sha256").update(identity).digest().readBigInt64BE(0);
}
