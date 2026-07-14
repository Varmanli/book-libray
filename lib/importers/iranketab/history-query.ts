import { IMPORT_STATUSES, type ImportStatus } from "./session-lifecycle";
export function parseImportHistoryQuery(sp: URLSearchParams) {
  const raw = sp.get("status") as ImportStatus;
  const date = (name: string) => {
    const value = sp.get(name);
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };
  return {
    page: Math.max(1, Number(sp.get("page")) || 1),
    status: IMPORT_STATUSES.includes(raw) ? raw : undefined,
    adminId: sp.get("adminId")?.trim() || undefined,
    source: sp.get("source")?.trim() || undefined,
    q: sp.get("q")?.trim().slice(0, 500) || undefined,
    from: date("from"),
    to: date("to"),
  };
}
