"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit3, Loader2, Plus, Power, RefreshCw } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminActionButton, AdminDataTable, AdminDataTableActions, AdminDataTableCell, AdminDataTablePagination, AdminDataTableRow, AdminDataTableSearch } from "@/components/admin/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, crawlStatusLabels, DiscoveryBadge, formatDate, Score, SourceTypeBadge, sourceTypeLabels } from "./IranKetabDiscoveryUi";

type Source = { id: string; name: string; sourceType: string; sourceUrl: string; sourceKey: string; importance: number; enabled: boolean; parserVersion: number; crawlIntervalMinutes: number; autoQueue: boolean; minimumQueueScore: number; crawlStatus: string; lastCrawledAt: string | null; nextCrawlAt: string | null; discoveredBookCount: number; newBookCount: number };
type SourceForm = { name: string; sourceType: string; sourceUrl: string; sourceKey: string; importance: number; enabled: boolean; parserVersion: number; crawlIntervalMinutes: number; autoQueue: boolean; minimumQueueScore: number };
const initialForm: SourceForm = { name: "", sourceType: "CURATED_LIST", sourceUrl: "", sourceKey: "", importance: 50, enabled: true, parserVersion: 1, crawlIntervalMinutes: 1440, autoQueue: false, minimumQueueScore: 85 };

export default function IranKetabDiscoverySourcesClient() {
  const [sources, setSources] = useState<Source[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<{ source?: Source } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await apiFetch<{ sources: Source[]; totalPages: number }>(`/api/admin/iranketab-discovery/sources?${new URLSearchParams({ page: String(page), q })}`);
      setSources(data.sources); setTotalPages(data.totalPages);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "بارگذاری منابع ناموفق بود"); }
    finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = setTimeout(() => setPage(1), 250); return () => clearTimeout(timer); }, [q]);

  async function toggle(source: Source) {
    try { await apiFetch(`/api/admin/iranketab-discovery/sources/${source.id}/enabled`, { method: "PATCH", body: JSON.stringify({ enabled: !source.enabled }) }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تغییر وضعیت ناموفق بود"); }
  }

  return <div className="space-y-6">
    <AdminPageHeader title="منابع کشف ایران‌کتاب" description="فهرست‌های منتخب، جوایز و مجموعه‌هایی که نامزدهای باارزش را معرفی می‌کنند." action={<Button onClick={() => setDialog({})}><Plus className="h-4 w-4" />افزودن منبع</Button>} />
    {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
    <div className="flex flex-wrap gap-3"><AdminDataTableSearch value={q} onChange={setQ} placeholder="جست‌وجوی نام، کلید یا نشانی منبع" /><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" />به‌روزرسانی</Button></div>
    <AdminDataTable loading={loading} isEmpty={!sources.length} emptyText="منبع کشفی ثبت نشده است" minWidth={960} columns={[{ key: "source", label: "منبع", align: "start" }, { key: "type", label: "نوع" }, { key: "importance", label: "اهمیت" }, { key: "enabled", label: "وضعیت" }, { key: "crawl", label: "آخرین اجرا" }, { key: "counts", label: "کشف" }, { key: "actions", label: "عملیات" }]} footer={<AdminDataTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />}>
      {sources.map((source) => <AdminDataTableRow key={source.id}>
        <AdminDataTableCell align="start"><p className="font-bold">{source.name}</p><p className="mt-1 max-w-72 truncate text-xs text-muted-foreground" dir="ltr">{source.sourceUrl}</p></AdminDataTableCell>
        <AdminDataTableCell><SourceTypeBadge value={source.sourceType} /></AdminDataTableCell>
        <AdminDataTableCell><Score value={source.importance} /></AdminDataTableCell>
        <AdminDataTableCell><DiscoveryBadge value={source.enabled ? "SUCCEEDED" : "PAUSED"} label={source.enabled ? "فعال" : "غیرفعال"} /></AdminDataTableCell>
        <AdminDataTableCell><DiscoveryBadge value={source.crawlStatus} label={crawlStatusLabels[source.crawlStatus] ?? source.crawlStatus} /><p className="mt-1 text-[11px] text-muted-foreground">{formatDate(source.lastCrawledAt)}</p></AdminDataTableCell>
        <AdminDataTableCell><span className="font-bold">{source.discoveredBookCount.toLocaleString("fa-IR")}</span><p className="mt-1 text-[11px] text-muted-foreground">{source.newBookCount.toLocaleString("fa-IR")} جدید</p></AdminDataTableCell>
        <AdminDataTableCell><AdminDataTableActions><AdminActionButton icon={<Edit3 className="h-4 w-4" />} title="ویرایش" onClick={() => setDialog({ source })} /><AdminActionButton icon={<Power className="h-4 w-4" />} title={source.enabled ? "غیرفعال کردن" : "فعال کردن"} onClick={() => void toggle(source)} /></AdminDataTableActions></AdminDataTableCell>
      </AdminDataTableRow>)}
    </AdminDataTable>
    <SourceDialog state={dialog} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); void load(); }} />
  </div>;
}

function SourceDialog({ state, onClose, onSaved }: { state: { source?: Source } | null; onClose: () => void; onSaved: () => void }) {
  const source = state?.source;
  const [form, setForm] = useState<SourceForm>(initialForm);
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => setForm(source ? { name: source.name, sourceType: source.sourceType, sourceUrl: source.sourceUrl, sourceKey: source.sourceKey, importance: source.importance, enabled: source.enabled, parserVersion: source.parserVersion, crawlIntervalMinutes: source.crawlIntervalMinutes, autoQueue: source.autoQueue, minimumQueueScore: source.minimumQueueScore } : initialForm), [source, state]);
  function set<K extends keyof SourceForm>(key: K, value: SourceForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); setError(""); try { const { enabled: _enabled, ...updateValues } = form; await apiFetch(source ? `/api/admin/iranketab-discovery/sources/${source.id}` : "/api/admin/iranketab-discovery/sources", { method: source ? "PATCH" : "POST", body: JSON.stringify(source ? updateValues : form) }); onSaved(); } catch (cause) { setError(cause instanceof Error ? cause.message : "ذخیره منبع ناموفق بود"); } finally { setSaving(false); } }
  return <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{source ? "ویرایش منبع کشف" : "افزودن منبع کشف"}</DialogTitle></DialogHeader><form onSubmit={submit} className="grid gap-4 pt-2"><Field label="نام منبع"><Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="نوع"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.sourceType} onChange={(e) => set("sourceType", e.target.value)}>{Object.entries(sourceTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="اهمیت (۰ تا ۱۰۰)"><Input type="number" min="0" max="100" value={form.importance} onChange={(e) => set("importance", Number(e.target.value))} required /></Field></div><Field label="نشانی ایران‌کتاب"><Input dir="ltr" type="url" value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} required /></Field><Field label="کلید پایدار"><Input dir="ltr" value={form.sourceKey} onChange={(e) => set("sourceKey", e.target.value)} required /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="فاصله اجرا (دقیقه)"><Input type="number" min="5" max="43200" value={form.crawlIntervalMinutes} onChange={(e) => set("crawlIntervalMinutes", Number(e.target.value))} required /></Field><Field label="حداقل امتیاز صف"><Input type="number" min="0" max="100" value={form.minimumQueueScore} onChange={(e) => set("minimumQueueScore", Number(e.target.value))} required /></Field></div><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.autoQueue} onChange={(e) => set("autoQueue", e.target.checked)} />افزودن خودکار نامزدهای واجد شرایط به صف</label>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>انصراف</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}ذخیره</Button></div></form></DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2"><Label>{label}</Label>{children}</label>; }
