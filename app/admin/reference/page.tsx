"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  REFERENCE_TYPE_LABELS,
  APPROVAL_STATUS_LABELS,
  type ReferenceTypeValue,
} from "@/lib/validations/reference";

interface Item {
  id: string;
  type: ReferenceTypeValue;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const TYPES = Object.keys(REFERENCE_TYPE_LABELS) as ReferenceTypeValue[];

const statusBadge: Record<string, string> = {
  APPROVED: "bg-primary/15 text-primary",
  PENDING: "bg-amber-500/15 text-amber-400",
  REJECTED: "bg-destructive/15 text-destructive",
};

export default function AdminReferencePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [q, setQ] = useState("");

  const [newType, setNewType] = useState<ReferenceTypeValue>("AUTHOR");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/reference?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
      else toast.error(data.error || "خطا در بارگذاری");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: newType, name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "ثبت ناموفق بود");
        return;
      }
      toast.success("ثبت شد");
      setNewName("");
      load();
    } finally {
      setCreating(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/reference/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("به‌روزرسانی شد");
      load();
    } else toast.error("عملیات ناموفق بود");
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/reference/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("حذف شد");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else toast.error("حذف ناموفق بود");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        فهرست‌های مرجع
      </h1>

      {/* افزودن */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-4 sm:flex-row sm:items-end">
        <div className="sm:w-44">
          <label className="mb-1.5 block text-xs text-muted-foreground">نوع</label>
          <Select value={newType} onValueChange={(v) => setNewType(v as ReferenceTypeValue)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {REFERENCE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs text-muted-foreground">نام</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="نام مقدار جدید"
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
        </div>
        <Button onClick={create} disabled={creating || !newName.trim()} className="gap-2">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          افزودن
        </Button>
      </div>

      {/* فیلترها */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="نوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">همه‌ی نوع‌ها</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {REFERENCE_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">همه‌ی وضعیت‌ها</SelectItem>
            <SelectItem value="PENDING">در انتظار تأیید</SelectItem>
            <SelectItem value="APPROVED">تأییدشده</SelectItem>
            <SelectItem value="REJECTED">ردشده</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جست‌وجو..."
          className="flex-1"
        />
      </div>

      {/* فهرست */}
      <div className="overflow-hidden rounded-2xl border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            موردی یافت نشد
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 bg-card/40 px-4 py-3"
              >
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {item.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {REFERENCE_TYPE_LABELS[item.type]}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    statusBadge[item.status]
                  )}
                >
                  {APPROVAL_STATUS_LABELS[item.status]}
                </span>
                <div className="flex items-center gap-1">
                  {item.status !== "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => setStatus(item.id, "APPROVED")}
                      aria-label="تأیید"
                      title="تأیید"
                      className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/10"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {item.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() => setStatus(item.id, "REJECTED")}
                      aria-label="رد"
                      title="رد"
                      className="rounded-lg p-1.5 text-amber-400 transition-colors hover:bg-amber-500/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label="حذف"
                    title="حذف"
                    className="rounded-lg p-1.5 text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
