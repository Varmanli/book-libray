"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageUploader } from "@/components/upload/ImageUploader";
import {
  AdminActionButton,
  AdminBadge,
  AdminColumn,
  AdminDataTable,
  AdminDataTableActions,
  AdminDataTableCell,
  AdminDataTableRow,
  AdminDataTableSearch,
  AdminDataTableToolbar,
} from "@/components/admin/AdminDataTable";
import { useConfirm } from "@/components/common/ConfirmDialog";
import {
  APPROVAL_STATUS_LABELS,
  type ReferenceTypeValue,
} from "@/lib/validations/reference";

interface Item {
  id: string;
  name: string;
  slug: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const statusBadge: Record<string, string> = {
  APPROVED: "bg-primary/15 text-primary",
  PENDING: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  REJECTED: "bg-destructive/15 text-destructive",
};

const REF_COLUMNS: AdminColumn[] = [
  { key: "name", label: "نام" },
  { key: "status", label: "وضعیت" },
  { key: "actions", label: "عملیات", align: "center" },
];

/**
 * Generic admin manager for one ReferenceItem type (categories/authors/…).
 * Wired to the shared /api/admin/reference endpoints.
 */
export default function ReferenceManager({
  type,
  itemLabel,
}: {
  type: ReferenceTypeValue;
  // عنوان/توضیح هنوز توسط صفحات پاس داده می‌شوند اما در نوار ابزار نمایش داده
  // نمی‌شوند (صفحات لیست مستقیم با کنترل‌ها شروع می‌شوند).
  title?: string;
  description?: string;
  itemLabel: string;
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    coverImage: "",
    bannerImage: "",
    status: "APPROVED" as Item["status"],
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
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
  }, [type, statusFilter, q]);

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
        body: JSON.stringify({ type, name: newName.trim() }),
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
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: status as Item["status"] } : i
        )
      );
    } else toast.error("عملیات ناموفق بود");
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setForm({
      name: item.name,
      slug: item.slug ?? "",
      description: item.description ?? "",
      coverImage: item.coverImage ?? "",
      bannerImage: item.bannerImage ?? "",
      status: item.status,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/reference/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || null,
          coverImage: form.coverImage || null,
          bannerImage: form.bannerImage || null,
          status: form.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "ذخیره ناموفق بود");
        return;
      }
      toast.success("ذخیره شد");
      setEditing(null);
      load();
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = (id: string) => {
    void confirm({
      title: "حذف مورد",
      description: `این ${itemLabel} حذف شود؟ این عملیات قابل بازگشت نیست.`,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/reference/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          toast.success("مورد حذف شد.");
          setItems((prev) => prev.filter((i) => i.id !== id));
        } else toast.error("حذف مورد ناموفق بود.");
      },
    });
  };

  return (
    <div>
      <AdminDataTableToolbar>
        <AdminDataTableSearch
          value={q}
          onChange={setQ}
          placeholder={`جست‌وجوی ${itemLabel}...`}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11 w-full rounded-2xl sm:w-48">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">همه‌ی وضعیت‌ها</SelectItem>
            <SelectItem value="PENDING">در انتظار تأیید</SelectItem>
            <SelectItem value="APPROVED">تأییدشده</SelectItem>
            <SelectItem value="REJECTED">ردشده</SelectItem>
          </SelectContent>
        </Select>
      </AdminDataTableToolbar>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/55 p-4 backdrop-blur-md sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs text-muted-foreground">
            {`افزودن ${itemLabel}`}
          </label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`نام ${itemLabel} جدید`}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
        </div>
        <Button onClick={create} disabled={creating || !newName.trim()} className="gap-2">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          افزودن
        </Button>
      </div>

      <AdminDataTable
        columns={REF_COLUMNS}
        loading={loading}
        isEmpty={items.length === 0}
        minWidth={460}
      >
        {items.map((item) => (
          <AdminDataTableRow key={item.id}>
            <AdminDataTableCell className="font-medium">
              {item.name}
            </AdminDataTableCell>
            <AdminDataTableCell>
              <AdminBadge className={statusBadge[item.status]}>
                {APPROVAL_STATUS_LABELS[item.status]}
              </AdminBadge>
            </AdminDataTableCell>
            <AdminDataTableCell align="center">
              <AdminDataTableActions>
                <AdminActionButton
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => openEdit(item)}
                  title="ویرایش"
                />
                {item.status !== "APPROVED" ? (
                  <AdminActionButton
                    icon={<Check className="h-4 w-4" />}
                    tone="primary"
                    onClick={() => setStatus(item.id, "APPROVED")}
                    title="تأیید"
                  />
                ) : null}
                {item.status !== "REJECTED" ? (
                  <AdminActionButton
                    icon={<X className="h-4 w-4" />}
                    onClick={() => setStatus(item.id, "REJECTED")}
                    title="رد"
                  />
                ) : null}
                <AdminActionButton
                  icon={<Trash2 className="h-4 w-4" />}
                  tone="danger"
                  onClick={() => remove(item.id)}
                  title="حذف"
                />
              </AdminDataTableActions>
            </AdminDataTableCell>
          </AdminDataTableRow>
        ))}
      </AdminDataTable>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-md"
        >
          <SheetHeader className="pt-12">
            <SheetTitle>{`ویرایش ${itemLabel}`}</SheetTitle>
            <SheetDescription className="sr-only">
              ویرایش نام، اسلاگ، تصاویر و توضیحات صفحه‌ی عمومی.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="ref-name">نام</Label>
              <Input
                id="ref-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref-slug">اسلاگ</Label>
              <Input
                id="ref-slug"
                dir="ltr"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="به‌صورت خودکار از نام ساخته می‌شود"
              />
            </div>

            <ImageUploader
              value={form.bannerImage}
              onChange={(url) => setForm((f) => ({ ...f, bannerImage: url }))}
              folder="references"
              variant="banner"
              label="بنر صفحه"
            />

            <ImageUploader
              value={form.coverImage}
              onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
              folder="references"
              variant="avatar"
              label="تصویر/لوگو"
            />

            <div className="space-y-1.5">
              <Label htmlFor="ref-desc">توضیحات</Label>
              <Textarea
                id="ref-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="min-h-28"
                placeholder="بیوگرافی/توضیح کوتاه..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref-status">وضعیت</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as Item["status"] }))
                }
              >
                <SelectTrigger id="ref-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">تأییدشده</SelectItem>
                  <SelectItem value="PENDING">در انتظار تأیید</SelectItem>
                  <SelectItem value="REJECTED">ردشده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter>
            <Button
              onClick={saveEdit}
              disabled={savingEdit || !form.name.trim()}
              className="w-full gap-2"
            >
              {savingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              ذخیره
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
