import { IranKetabExtractionError } from "./errors.js";
import { extractIranKetabEditionCode, normalizeIranKetabBookUrl } from "./validate-url.js";

export const IRANKETAB_PAGE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  Referer: "https://www.iranketab.ir/"
};
export const IRANKETAB_IMAGE_ACCEPT = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
export type IranKetabFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export async function fetchIranKetabHtml(url: string, fetcher: IranKetabFetcher = globalThis.fetch): Promise<{ pageUrl: string; html: string; selectedEditionCode: string | null }> {
  const pageUrl = normalizeIranKetabBookUrl(url);
  let response: Response;
  try { response = await fetcher(pageUrl, { headers: IRANKETAB_PAGE_HEADERS }); }
  catch (cause) { throw new IranKetabExtractionError({ code: "FETCH_FAILED", message: "Failed to fetch the IranKetab page.", retryable: true, context: { pageUrl }, cause }); }
  if (!response.ok) throw new IranKetabExtractionError({ code: "FETCH_FAILED", message: `Failed to fetch page: ${response.status} ${response.statusText}`, retryable: response.status >= 500 || response.status === 429, context: { pageUrl, status: response.status } });
  let html: string;
  try { html = await response.text(); }
  catch (cause) { throw new IranKetabExtractionError({ code: "INVALID_RESPONSE", message: "IranKetab response could not be read as HTML.", retryable: true, context: { pageUrl }, cause }); }
  return { pageUrl, html, selectedEditionCode: extractIranKetabEditionCode(url) };
}


