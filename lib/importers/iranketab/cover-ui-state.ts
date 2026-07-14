import type { PreparedCoverResult } from "./cover-contract";

export function deriveCoverUiState(results: PreparedCoverResult[]) {
  const prepared = results.filter((item) => item.status === "PREPARED").length;
  const failed = results.filter((item) => item.status === "FAILED").length;
  const skipped = results.filter((item) => item.status === "SKIPPED").length;
  const keptExisting = results.filter((item) => item.status === "KEPT_EXISTING").length;
  return {
    prepared,
    failed,
    skipped,
    keptExisting,
    status: failed > 0 ? "ناموفق" : prepared > 0 ? "آماده" : "در انتظار",
  } as const;
}
