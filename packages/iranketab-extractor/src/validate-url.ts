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
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) {
    throw new IranKetabExtractionError({ code: "INVALID_URL", message: "IranKetab URL must use HTTPS without credentials or a custom port." });
  }
  if (!SUPPORTED_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new IranKetabExtractionError({ code: "UNSUPPORTED_HOST", message: "Only IranKetab book URLs are supported.", context: { hostname: parsed.hostname } });
  }
  if (!isBookPath(parsed.pathname)) {
    throw new IranKetabExtractionError({ code: "PAGE_STRUCTURE_UNRECOGNIZED", message: "Only IranKetab book URLs are supported." });
  }
  // IranKetab's book identity is the numeric path segment. Query parameters
  // are presentation/tracking data and must not create a second import key.
  parsed.search = "";
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
