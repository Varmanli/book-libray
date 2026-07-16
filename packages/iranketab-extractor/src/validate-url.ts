import { IranKetabExtractionError } from "./errors.js";

const SUPPORTED_HOSTS = new Set(["iranketab.ir", "www.iranketab.ir"]);

function isBookPath(pathname: string): boolean {
  let decoded: string;
  try { decoded = decodeURIComponent(pathname); } catch { return false; }
  return /^\/book\/\d+(?:-[^/]+)?\/?$/u.test(decoded);
}

export function normalizeIranKetabBookUrl(value: string): string {
  let parsed: URL;
  try { parsed = new URL(value.trim()); }
  catch (cause) { throw new IranKetabExtractionError({ code: "INVALID_URL", message: "IranKetab URL is invalid.", cause }); }
  if (!SUPPORTED_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new IranKetabExtractionError({ code: "UNSUPPORTED_HOST", message: "Only IranKetab book URLs are supported.", context: { hostname: parsed.hostname } });
  }
  if (!isBookPath(parsed.pathname)) {
    throw new IranKetabExtractionError({ code: "PAGE_STRUCTURE_UNRECOGNIZED", message: "Only IranKetab book URLs are supported." });
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
