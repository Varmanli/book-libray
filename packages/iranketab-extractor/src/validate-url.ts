import { IranKetabExtractionError } from "./errors.js";

const SUPPORTED_HOSTS = new Set(["iranketab.ir", "www.iranketab.ir"]);

export function normalizeIranKetabBookUrl(value: string): string {
  let parsed: URL;
  try { parsed = new URL(value.trim()); }
  catch (cause) { throw new IranKetabExtractionError({ code: "INVALID_URL", message: "IranKetab URL is invalid.", cause }); }
  if (!SUPPORTED_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new IranKetabExtractionError({ code: "UNSUPPORTED_HOST", message: "Only IranKetab book URLs are supported.", context: { hostname: parsed.hostname } });
  }
  parsed.hash = "";
  return parsed.toString();
}

export function extractIranKetabEditionCode(value: string): string | null {
  let parsed: URL;
  try { parsed = new URL(value.trim()); }
  catch (cause) { throw new IranKetabExtractionError({ code: "INVALID_URL", message: "IranKetab URL is invalid.", cause }); }
  const params = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const code = params.get("pts")?.trim();
  return code || null;
}


