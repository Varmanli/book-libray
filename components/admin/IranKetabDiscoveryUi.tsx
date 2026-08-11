"use client";

import { AdminBadge } from "@/components/admin/AdminDataTable";
import { cn } from "@/lib/utils";

export const sourceTypeLabels: Record<string, string> = {
  AWARD: "جایزه",
  CURATED_LIST: "فهرست منتخب",
  EDITORIAL_COLLECTION: "مجموعه تحریریه",
  AUTHOR: "نویسنده",
  PUBLISHER: "ناشر",
  TAG: "برچسب",
  SEARCH: "جست‌وجو",
};

export const crawlStatusLabels: Record<string, string> = {
  IDLE: "آماده",
  RUNNING: "در حال اجرا",
  SUCCEEDED: "موفق",
  FAILED: "ناموفق",
  PAUSED: "متوقف",
};

export const itemStatusLabels: Record<string, string> = {
  DISCOVERED: "کشف‌شده",
  SCORED: "امتیازدهی‌شده",
  QUEUED: "آماده ورود",
  IMPORTING: "در حال ورود",
  IMPORTED: "واردشده",
  NEEDS_REVIEW: "نیازمند بررسی",
  SKIPPED: "نادیده‌گرفته‌شده",
  FAILED: "ناموفق",
};

export const confidenceLabels: Record<string, string> = {
  HIGH: "بالا",
  MEDIUM: "متوسط",
  LOW: "پایین",
};

export const importJobStatusLabels: Record<string, string> = {
  PENDING: "در انتظار",
  PROCESSING: "در حال پردازش",
  COMPLETED: "آماده بررسی",
  FAILED: "ناموفق",
  CANCELLED: "لغوشده",
};

const statusTone: Record<string, string> = {
  RUNNING: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  SUCCEEDED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  IMPORTED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  QUEUED: "border-primary/30 bg-primary/10 text-primary",
  IMPORTING: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  NEEDS_REVIEW: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  FAILED: "border-destructive/30 bg-destructive/10 text-destructive",
  SKIPPED: "border-border bg-muted/50 text-muted-foreground",
  PAUSED: "border-border bg-muted/50 text-muted-foreground",
  HIGH: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  LOW: "border-border bg-muted/50 text-muted-foreground",
  PENDING: "border-primary/30 bg-primary/10 text-primary",
  PROCESSING: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  COMPLETED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  CANCELLED: "border-border bg-muted/50 text-muted-foreground",
};

export function DiscoveryBadge({ value, label }: { value: string; label: string }) {
  return <AdminBadge className={statusTone[value] ?? "border-border bg-muted/50 text-muted-foreground"}>{label}</AdminBadge>;
}

export function SourceTypeBadge({ value }: { value: string }) {
  return <AdminBadge className="border-primary/20 bg-primary/8 text-primary">{sourceTypeLabels[value] ?? value}</AdminBadge>;
}

export function Score({ value, className }: { value: number; className?: string }) {
  return <span className={cn("font-black tabular-nums text-primary", className)}>{value.toLocaleString("fa-IR")}<span className="mr-1 text-[10px] text-muted-foreground">/۱۰۰</span></span>;
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok || !payload) throw new Error(payload?.error ?? "ارتباط با سرور ناموفق بود");
  return payload;
}

export function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString("fa-IR") : "—";
}
