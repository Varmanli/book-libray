"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminActionButton,
  AdminBadge,
  AdminColumn,
  AdminDataTable,
  AdminDataTableActions,
  AdminDataTableCell,
  AdminDataTablePagination,
  AdminDataTableRow,
  AdminDataTableSearch,
  AdminDataTableToolbar,
} from "@/components/admin/AdminDataTable";
import { useConfirm } from "@/components/common/ConfirmDialog";

interface AdminBookRow {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  coverImage: string | null;
  editionCount: number;
  linkCount: number;
  createdByName: string | null;
  createdAt: string;
}

const COLUMNS: AdminColumn[] = [
  { key: "book", label: "کتاب" },
  { key: "genre", label: "ژانر" },
  { key: "editions", label: "نسخه‌ها" },
  { key: "status", label: "وضعیت" },
  { key: "creator", label: "سازنده" },
  { key: "date", label: "تاریخ" },
  { key: "actions", label: "عملیات", align: "center" },
];

const STATUS_BADGE: Record<string, string> = {
  APPROVED: "bg-primary/15 text-primary",
  PENDING: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  REJECTED: "bg-destructive/15 text-destructive",
};
const STATUS_LABEL: Record<string, string> = {
  APPROVED: "تأییدشده",
  PENDING: "در انتظار",
  REJECTED: "ردشده",
};

export default function AdminBooksPage() {
  const confirm = useConfirm();
  const router = useRouter();
  const [rows, setRows] = useState<AdminBookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (q.trim()) params.set("q", q.trim());
      if (status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/admin/books?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در بارگذاری");
        return;
      }
      setRows(data.books || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  const setBookStatus = async (id: string, next: "APPROVED" | "REJECTED") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "عملیات ناموفق بود");
        return;
      }
      toast.success(data.message || "انجام شد");
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: next } : r))
      );
    } finally {
      setBusyId(null);
    }
  };

  const remove = (id: string) => {
    void confirm({
      title: "حذف کتاب",
      description: "این کتاب کاتالوگ حذف شود؟ نسخه‌ها هم حذف می‌شوند.",
      onConfirm: async () => {
        setBusyId(id);
        try {
          const res = await fetch(`/api/admin/books/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            toast.error("حذف کتاب ناموفق بود.");
            return;
          }
          toast.success("کتاب حذف شد.");
          setRows((prev) => prev.filter((r) => r.id !== id));
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  return (
    <div>
      <AdminDataTableToolbar>
        <AdminDataTableSearch
          value={q}
          onChange={setQ}
          placeholder="عنوان یا نویسنده..."
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-full rounded-2xl sm:w-48">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">همه‌ی وضعیت‌ها</SelectItem>
            <SelectItem value="PENDING">در انتظار</SelectItem>
            <SelectItem value="APPROVED">تأییدشده</SelectItem>
            <SelectItem value="REJECTED">ردشده</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild className="h-11 w-full gap-2 rounded-2xl sm:w-auto sm:px-5">
          <Link href="/admin/books/new">
            <Plus className="h-4 w-4" />
            افزودن کتاب
          </Link>
        </Button>
      </AdminDataTableToolbar>

      <AdminDataTable
        columns={COLUMNS}
        loading={loading}
        isEmpty={rows.length === 0}
        footer={
          <AdminDataTablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        }
      >
        {rows.map((b) => (
          <AdminDataTableRow key={b.id}>
            <AdminDataTableCell>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                  {b.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.coverImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {b.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.author}
                  </p>
                </div>
              </div>
            </AdminDataTableCell>
            <AdminDataTableCell className="text-muted-foreground">
              {b.genre || "—"}
            </AdminDataTableCell>
            <AdminDataTableCell className="tabular-nums text-muted-foreground">
              {b.editionCount.toLocaleString("fa-IR")}
              {b.linkCount > 0 ? (
                <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {b.linkCount.toLocaleString("fa-IR")} لینک
                </span>
              ) : null}
            </AdminDataTableCell>
            <AdminDataTableCell>
              <AdminBadge className={STATUS_BADGE[b.status]}>
                {STATUS_LABEL[b.status]}
              </AdminBadge>
            </AdminDataTableCell>
            <AdminDataTableCell className="text-xs text-muted-foreground">
              {b.createdByName || "—"}
            </AdminDataTableCell>
            <AdminDataTableCell className="text-xs tabular-nums text-muted-foreground">
              {new Date(b.createdAt).toLocaleDateString("fa-IR")}
            </AdminDataTableCell>
            <AdminDataTableCell align="center">
              <AdminDataTableActions>
                <AdminActionButton
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => router.push(`/admin/books/${b.id}/edit`)}
                  disabled={busyId === b.id}
                  title="ویرایش"
                />
                {b.status !== "APPROVED" ? (
                  <AdminActionButton
                    icon={<Check className="h-4 w-4" />}
                    tone="primary"
                    onClick={() => setBookStatus(b.id, "APPROVED")}
                    disabled={busyId === b.id}
                    title="تأیید"
                  />
                ) : null}
                {b.status !== "REJECTED" ? (
                  <AdminActionButton
                    icon={
                      busyId === b.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )
                    }
                    onClick={() => setBookStatus(b.id, "REJECTED")}
                    disabled={busyId === b.id}
                    title="رد"
                  />
                ) : null}
                <AdminActionButton
                  icon={<Trash2 className="h-4 w-4" />}
                  tone="danger"
                  onClick={() => remove(b.id)}
                  disabled={busyId === b.id}
                  title="حذف"
                />
              </AdminDataTableActions>
            </AdminDataTableCell>
          </AdminDataTableRow>
        ))}
      </AdminDataTable>
    </div>
  );
}
