"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, PenSquare, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/components/common/ConfirmDialog";

interface AdminBlogRow {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  authorName: string | null;
  categoryName: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

const COLUMNS: AdminColumn[] = [
  { key: "title", label: "نوشته" },
  { key: "category", label: "دسته‌بندی" },
  { key: "status", label: "وضعیت" },
  { key: "author", label: "نویسنده" },
  { key: "publishedAt", label: "انتشار" },
  { key: "updatedAt", label: "به‌روزرسانی" },
  { key: "actions", label: "عملیات", align: "center" },
];

const STATUS_BADGE: Record<AdminBlogRow["status"], string> = {
  DRAFT: "border-amber-500/20 bg-amber-500/15 text-amber-400",
  PUBLISHED: "border-primary/20 bg-primary/15 text-primary",
};

const STATUS_LABEL: Record<AdminBlogRow["status"], string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشرشده",
};

export default function AdminBlogPage() {
  const confirm = useConfirm();
  const [rows, setRows] = useState<AdminBlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "DRAFT" | "PUBLISHED">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        status,
      });
      if (q.trim()) params.set("q", q.trim());

      const response = await fetch(`/api/admin/blog?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "بارگذاری نوشته‌ها ناموفق بود.");
        return;
      }
      setRows(data.posts ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => {
    const timer = setTimeout(load, 220);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  const remove = (id: string) => {
    void confirm({
      title: "حذف نوشته",
      description: "این نوشته به‌طور کامل حذف شود؟",
      onConfirm: async () => {
        setBusyId(id);
        try {
          const response = await fetch(`/api/admin/blog/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          const data = await response.json();
          if (!response.ok) {
            toast.error(data.error || "حذف نوشته ناموفق بود.");
            return;
          }
          toast.success(data.message || "نوشته حذف شد.");
          setRows((current) => current.filter((row) => row.id !== id));
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
          placeholder="جست‌وجو در عنوان، خلاصه یا اسلاگ..."
        />
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="h-11 w-full rounded-2xl sm:w-48">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">همه وضعیت‌ها</SelectItem>
            <SelectItem value="DRAFT">پیش‌نویس</SelectItem>
            <SelectItem value="PUBLISHED">منتشرشده</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild className="h-11 w-full gap-2 rounded-2xl sm:w-auto sm:px-5">
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4" />
            افزودن نوشته
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
        {rows.map((row) => (
          <AdminDataTableRow key={row.id}>
            <AdminDataTableCell align="start">
              <div className="space-y-1">
                <p className="line-clamp-1 font-bold text-foreground">{row.title}</p>
                <p dir="ltr" className="line-clamp-1 text-xs text-muted-foreground">
                  /blog/{row.slug}
                </p>
              </div>
            </AdminDataTableCell>

            <AdminDataTableCell>
              <span className="text-xs text-muted-foreground">
                {row.categoryName || "—"}
              </span>
            </AdminDataTableCell>

            <AdminDataTableCell>
              <AdminBadge className={STATUS_BADGE[row.status]}>
                {STATUS_LABEL[row.status]}
              </AdminBadge>
            </AdminDataTableCell>

            <AdminDataTableCell className="text-xs text-muted-foreground">
              {row.authorName || "—"}
            </AdminDataTableCell>

            <AdminDataTableCell className="text-xs text-muted-foreground">
              {row.publishedAt
                ? new Date(row.publishedAt).toLocaleDateString("fa-IR")
                : "—"}
            </AdminDataTableCell>

            <AdminDataTableCell className="text-xs text-muted-foreground">
              {new Date(row.updatedAt).toLocaleDateString("fa-IR")}
            </AdminDataTableCell>

            <AdminDataTableCell align="center">
              <AdminDataTableActions>
                {row.status === "PUBLISHED" ? (
                  <AdminActionButton
                    href={`/blog/${encodeURIComponent(row.slug)}`}
                    external
                    icon={<Eye className="h-4 w-4" />}
                    title="مشاهده"
                  />
                ) : null}
                <AdminActionButton
                  href={`/admin/blog/${row.id}/edit`}
                  icon={<PenSquare className="h-4 w-4" />}
                  title="ویرایش"
                />
                <AdminActionButton
                  icon={
                    busyId === row.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )
                  }
                  tone="danger"
                  onClick={() => remove(row.id)}
                  disabled={busyId === row.id}
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
