"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Ban, RefreshCw, RotateCcw } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminActionButton, AdminDataTable, AdminDataTableActions, AdminDataTableCell, AdminDataTablePagination, AdminDataTableRow } from "@/components/admin/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, DiscoveryBadge, formatDate, importJobStatusLabels, Score } from "./IranKetabDiscoveryUi";

type Job = { id: string; discoveryItemId: string; status: string; priority: number; attempts: number; maxAttempts: number; createdAt: string; lastErrorCode: string | null; lastErrorMessage: string | null };
type Row = { job: Job; titleHint: string | null; authorHint: string | null; itemStatus: string; canonicalUrl: string };
const statuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"];

export default function IranKetabDiscoveryJobsClient() {
  const [jobs, setJobs] = useState<Row[]>([]); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "ALL", minimumPriority: "", from: "", to: "" });
  const load = useCallback(async () => { setLoading(true); setError(""); try { const params = new URLSearchParams({ page: String(page), status: filters.status }); if (filters.minimumPriority) params.set("minimumPriority", filters.minimumPriority); if (filters.from) params.set("from", filters.from); if (filters.to) params.set("to", filters.to); const data = await apiFetch<{ jobs: Row[]; totalPages: number }>(`/api/admin/iranketab-discovery/import-jobs?${params}`); setJobs(data.jobs); setTotalPages(data.totalPages); } catch (cause) { setError(cause instanceof Error ? cause.message : "بارگذاری صف ناموفق بود"); } finally { setLoading(false); } }, [filters, page]);
  useEffect(() => { void load(); }, [load]);
  function update(key: keyof typeof filters, value: string) { setPage(1); setFilters((current) => ({ ...current, [key]: value })); }
  async function action(job: Job, actionName: "RETRY" | "CANCEL") { setError(""); try { await apiFetch(`/api/admin/iranketab-discovery/import-jobs/${job.id}`, { method: "PATCH", body: JSON.stringify({ action: actionName }) }); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "عملیات صف ناموفق بود"); } }
  return <div className="space-y-6"><AdminPageHeader title="صف ورود کشف ایران‌کتاب" description="این صف فقط پیش‌نمایش ورود را آماده می‌کند؛ ثبت نهایی کتاب همچنان دستی است." />
    {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
    <div className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-card/40 p-4 sm:grid-cols-2 lg:grid-cols-5"><Filter label="وضعیت" value={filters.status} onChange={(value) => update("status", value)}><option value="ALL">همه وضعیت‌ها</option>{statuses.map((value) => <option key={value} value={value}>{importJobStatusLabels[value]}</option>)}</Filter><label className="grid gap-1 text-xs font-bold text-muted-foreground">حداقل اولویت<Input type="number" min="0" max="100" value={filters.minimumPriority} onChange={(e) => update("minimumPriority", e.target.value)} /></label><label className="grid gap-1 text-xs font-bold text-muted-foreground">از تاریخ<Input type="date" value={filters.from} onChange={(e) => update("from", e.target.value)} /></label><label className="grid gap-1 text-xs font-bold text-muted-foreground">تا تاریخ<Input type="date" value={filters.to} onChange={(e) => update("to", e.target.value)} /></label><div className="flex items-end"><Button variant="outline" className="w-full" onClick={() => void load()}><RefreshCw className="h-4 w-4" />به‌روزرسانی</Button></div></div>
    <AdminDataTable loading={loading} isEmpty={!jobs.length} emptyText="کاری در صف ورود وجود ندارد" minWidth={940} columns={[{ key: "book", label: "کتاب", align: "start" }, { key: "priority", label: "اولویت" }, { key: "status", label: "وضعیت" }, { key: "attempts", label: "تلاش‌ها" }, { key: "created", label: "ایجاد" }, { key: "error", label: "خطا", align: "start" }, { key: "actions", label: "عملیات" }]} footer={<AdminDataTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />}>
      {jobs.map(({ job, titleHint, authorHint }) => <AdminDataTableRow key={job.id}><AdminDataTableCell align="start"><Link className="font-bold text-primary hover:underline" href={`/admin/iranketab-discovery/items/${job.discoveryItemId}`}>{titleHint ?? "عنوان نامشخص"}</Link><p className="mt-1 text-xs text-muted-foreground">{authorHint ?? "نویسنده نامشخص"}</p></AdminDataTableCell><AdminDataTableCell><Score value={job.priority} /></AdminDataTableCell><AdminDataTableCell><DiscoveryBadge value={job.status} label={importJobStatusLabels[job.status] ?? job.status} /></AdminDataTableCell><AdminDataTableCell>{job.attempts.toLocaleString("fa-IR")} / {job.maxAttempts.toLocaleString("fa-IR")}</AdminDataTableCell><AdminDataTableCell><span className="text-xs">{formatDate(job.createdAt)}</span></AdminDataTableCell><AdminDataTableCell align="start"><p className="max-w-56 text-xs text-destructive">{job.lastErrorMessage ?? "—"}</p></AdminDataTableCell><AdminDataTableCell><AdminDataTableActions>{job.status === "FAILED" ? <AdminActionButton icon={<RotateCcw className="h-4 w-4" />} title="تلاش مجدد" onClick={() => void action(job, "RETRY")} /> : null}{job.status === "PENDING" ? <AdminActionButton tone="danger" icon={<Ban className="h-4 w-4" />} title="لغو کار" onClick={() => void action(job, "CANCEL")} /> : null}</AdminDataTableActions></AdminDataTableCell></AdminDataTableRow>)}
    </AdminDataTable>
  </div>;
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="grid gap-1 text-xs font-bold text-muted-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">{children}</select></label>; }
