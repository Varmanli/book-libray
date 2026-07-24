"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Palette,
  Pencil,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ImageUploader } from "@/components/upload/ImageUploader";
import { QuoteBackground as QuoteBackgroundPreview } from "@/components/profile/QuoteCard";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";

export interface AdminQuoteBackgroundRow {
  id: string;
  value: string;
  label: string;
  image: string | null;
  imageKey: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  isSystem: boolean;
  quoteCount: number;
  createdAt: string;
  updatedAt: string;
}

const COLUMNS: AdminColumn[] = [
  { key: "preview", label: "پیش‌نمایش", align: "start" },
  { key: "label", label: "عنوان و شناسه" },
  { key: "type", label: "نوع پس‌زمینه" },
  { key: "usage", label: "تعداد تکه‌ها" },
  { key: "order", label: "ترتیب" },
  { key: "status", label: "وضعیت" },
  { key: "actions", label: "عملیات", align: "center" },
];

export default function QuoteBackgroundsManager() {
  const confirm = useConfirm();
  const [items, setItems] = useState<AdminQuoteBackgroundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminQuoteBackgroundRow | null>(null);

  const [label, setLabel] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/quote-backgrounds", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.backgrounds ?? []);
      } else {
        toast.error(data.error || "خطا در بارگذاری پس‌زمینه‌ها");
      }
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(term) ||
        item.value.toLowerCase().includes(term),
    );
  }, [items, q]);

  const openCreate = () => {
    setEditingItem(null);
    setLabel("");
    setImageKey(null);
    setImageUrl(null);
    setIsActive(true);
    setDisplayOrder(items.length);
    setDialogOpen(true);
  };

  const openEdit = (item: AdminQuoteBackgroundRow) => {
    setEditingItem(item);
    setLabel(item.label);
    setImageKey(item.imageKey);
    setImageUrl(item.imageUrl || item.image);
    setIsActive(item.isActive);
    setDisplayOrder(item.displayOrder);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!label.trim()) {
      toast.error("عنوان پس‌زمینه الزامی است");
      return;
    }

    const isDefault = editingItem?.value === "default";

    if (!isDefault && !imageKey && !imageUrl) {
      toast.error("تصویر پس‌زمینه الزامی است");
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(editingItem);
      const url = isEdit
        ? `/api/admin/quote-backgrounds/${editingItem!.id}`
        : "/api/admin/quote-backgrounds";
      const method = isEdit ? "PUT" : "POST";

      const body = {
        label: label.trim(),
        imageKey: isDefault ? null : imageKey,
        imageUrl: isDefault ? null : imageUrl,
        isActive: isDefault ? true : isActive,
        displayOrder,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ذخیره‌سازی");
      }

      toast.success(data.message || "با موفقیت ذخیره شد");
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ذخیره‌سازی ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: AdminQuoteBackgroundRow) => {
    if (item.value === "default") {
      toast.error("پس‌زمینه پیش‌فرض سیستم را نمی‌توان غیرفعال کرد.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/quote-backgrounds/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        !item.isActive
          ? "پس‌زمینه فعال شد."
          : "پس‌زمینه غیرفعال شد.",
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تغییر وضعیت ناموفق بود");
    }
  };

  const remove = (item: AdminQuoteBackgroundRow) => {
    if (item.value === "default") {
      toast.error("پس‌زمینه پیش‌فرض سیستم قابل حذف نیست.");
      return;
    }

    if (item.quoteCount > 0) {
      toast.error(
        `این پس‌زمینه در ${item.quoteCount.toLocaleString("fa-IR")} تکه‌کتاب استفاده شده است و قابل حذف نیست. می‌توانید آن را غیرفعال کنید.`,
      );
      return;
    }

    void confirm({
      title: "آیا از حذف این پس‌زمینه مطمئن هستید؟",
      description: `پس‌زمینه «${item.label}» برای همیشه حذف خواهد شد. این عملیات قابل بازگشت نیست.`,
      confirmLabel: "حذف پس‌زمینه",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/quote-backgrounds/${item.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "حذف ناموفق بود");
          throw new Error();
        }
        toast.success(data.message || "پس‌زمینه حذف شد");
        await load();
      },
    });
  };

  const moveOrder = async (index: number, direction: "up" | "down") => {
    const newItems = [...filtered];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const tempOrder = newItems[index].displayOrder;
    newItems[index].displayOrder = newItems[targetIndex].displayOrder;
    newItems[targetIndex].displayOrder = tempOrder;

    // Swap in array
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];

    setItems((prev) =>
      prev.map((orig) => {
        const updated = newItems.find((ni) => ni.id === orig.id);
        return updated ? { ...orig, displayOrder: updated.displayOrder } : orig;
      }),
    );

    setReordering(true);
    try {
      const res = await fetch("/api/admin/quote-backgrounds/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: newItems.map((it, idx) => ({ id: it.id, displayOrder: idx })),
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("تغییر ترتیب ذخیره نشد");
      await load();
    } finally {
      setReordering(false);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.isActive).length;
    const totalQuotes = items.reduce((acc, i) => acc + i.quoteCount, 0);
    return { total, active, totalQuotes };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
            مدیریت پس‌زمینه‌های تکه کتاب
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            پس‌زمینه‌های قابل انتخاب برای تکه کتاب‌ها را اضافه، ویرایش، ترتیب‌بندی یا غیرفعال کنید.
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="gap-2 rounded-2xl font-bold shadow-sm"
        >
          <Plus className="h-4 w-4" />
          افزودن پس‌زمینه جدید
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">
            کل پس‌زمینه‌ها
          </p>
          <p className="mt-2 text-2xl font-black text-foreground">
            {stats.total.toLocaleString("fa-IR")}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">
            پس‌زمینه‌های فعال
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.active.toLocaleString("fa-IR")}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">
            کل استفاده در تکه‌ها
          </p>
          <p className="mt-2 text-2xl font-black text-primary">
            {stats.totalQuotes.toLocaleString("fa-IR")}
          </p>
        </div>
      </div>

      {/* Toolbar & Data Table */}
      <div className="space-y-4">
        <AdminDataTableToolbar>
          <AdminDataTableSearch
            value={q}
            onChange={setQ}
            placeholder="جست‌وجوی عنوان یا شناسه..."
          />
        </AdminDataTableToolbar>

        <AdminDataTable
          columns={COLUMNS}
          loading={loading}
          isEmpty={!loading && filtered.length === 0}
          emptyText={
            q.trim()
              ? "موردی مطابق با جست‌وجوی شما پیدا نشد."
              : "هنوز هیچ پس‌زمینه‌ای ثبت نشده است."
          }
          minWidth={850}
        >
          {filtered.map((item, index) => {
            const isDefault = item.value === "default";

            return (
              <AdminDataTableRow key={item.id}>
                {/* Preview */}
                <AdminDataTableCell align="start">
                  <div className="relative h-16 w-24 overflow-hidden rounded-xl border border-border/70 bg-black/5 shadow-inner">
                    {/* Render live card background */}
                    {isDefault ? (
                      <div className="flex h-full w-full items-center justify-center bg-background/80 text-[11px] font-bold text-muted-foreground">
                        پیش‌فرض
                      </div>
                    ) : item.image ? (
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url("${item.image}")` }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </AdminDataTableCell>

                {/* Label & Value */}
                <AdminDataTableCell>
                  <div>
                    <span className="font-bold text-foreground">
                      {item.label}
                    </span>
                    <span
                      dir="ltr"
                      className="block text-xs font-mono text-muted-foreground/80"
                    >
                      {item.value}
                    </span>
                  </div>
                </AdminDataTableCell>

                {/* Type Badge */}
                <AdminDataTableCell>
                  {isDefault ? (
                    <AdminBadge className="bg-primary/5 text-primary border-primary/20">
                      سیستم (بدون تصویر)
                    </AdminBadge>
                  ) : item.isSystem ? (
                    <AdminBadge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      پیش‌فرض اولیه
                    </AdminBadge>
                  ) : (
                    <AdminBadge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      مدیریت‌شده
                    </AdminBadge>
                  )}
                </AdminDataTableCell>

                {/* Quote Usage */}
                <AdminDataTableCell>
                  <span className="font-bold tabular-nums">
                    {item.quoteCount.toLocaleString("fa-IR")}
                  </span>
                </AdminDataTableCell>

                {/* Order Controls */}
                <AdminDataTableCell>
                  <div className="flex items-center gap-1">
                    <span className="w-6 text-center text-xs font-bold tabular-nums text-muted-foreground">
                      {item.displayOrder}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={() => moveOrder(index, "up")}
                      disabled={index === 0 || reordering}
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={() => moveOrder(index, "down")}
                      disabled={index === filtered.length - 1 || reordering}
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </AdminDataTableCell>

                {/* Active Status */}
                <AdminDataTableCell>
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    disabled={isDefault}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition",
                      isDefault
                        ? "cursor-not-allowed bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : item.isActive
                          ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                          : "bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:text-red-400",
                    )}
                  >
                    {item.isActive ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        فعال
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        غیرفعال
                      </>
                    )}
                  </button>
                </AdminDataTableCell>

                {/* Actions */}
                <AdminDataTableCell align="center">
                  <AdminDataTableActions>
                    <AdminActionButton
                      icon={<Pencil className="h-4 w-4" />}
                      title="ویرایش"
                      onClick={() => openEdit(item)}
                    />
                    <AdminActionButton
                      icon={<Trash2 className="h-4 w-4" />}
                      title={
                        isDefault
                          ? "پس‌زمینه پیش‌فرض قابل حذف نیست"
                          : item.quoteCount > 0
                            ? "این پس‌زمینه در تکه‌ها استفاده شده است"
                            : "حذف"
                      }
                      tone="danger"
                      disabled={isDefault || item.quoteCount > 0}
                      onClick={() => remove(item)}
                    />
                  </AdminDataTableActions>
                </AdminDataTableCell>
              </AdminDataTableRow>
            );
          })}
        </AdminDataTable>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[calc(100dvh-24px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "ویرایش پس‌زمینه" : "افزودن پس‌زمینه جدید"}
            </DialogTitle>
            <DialogDescription>
              مشخصات و تصویر پس‌زمینه را تنظیم کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="bg-label" className="text-sm font-bold">
                عنوان پس‌زمینه <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bg-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثلاً: طرح پاییزی، غروب..."
                className="rounded-2xl"
              />
            </div>

            {/* Identifier info (if editing) */}
            {editingItem && (
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
                <span className="font-bold text-muted-foreground">شناسه ثابت: </span>
                <code dir="ltr" className="font-mono text-foreground">{editingItem.value}</code>
              </div>
            )}

            {/* Image Uploader (not for default) */}
            {editingItem?.value === "default" ? (
              <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center text-xs text-muted-foreground">
                <ShieldAlert className="mx-auto mb-1 h-5 w-5 text-primary" />
                پس‌زمینه «پیش‌فرض» یک حالت سیستم بدون تصویر است و از استایل پایه کاغذ استفاده می‌کند.
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-bold">
                  تصویر پس‌زمینه <span className="text-destructive">*</span>
                </Label>
                <ImageUploader
                  folder="quote-backgrounds"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  onKeyChange={(key) => setImageKey(key)}
                  onUploadStateChange={setUploading}
                  variant="banner"
                  description="فرمت‌های JPG، PNG یا WebP تا ۴ مگابایت"
                />
              </div>
            )}

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="bg-order" className="text-sm font-bold">
                ترتیب نمایش
              </Label>
              <Input
                id="bg-order"
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="rounded-2xl"
              />
            </div>

            {/* Active toggle */}
            {editingItem?.value !== "default" && (
              <div className="flex items-center justify-between rounded-2xl border border-border/70 p-3.5">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    وضعیت پس‌زمینه
                  </p>
                  <p className="text-xs text-muted-foreground">
                    در صورت فعال بودن، در انتخابگر تکه‌کتاب برای کاربران نمایش داده می‌شود.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    isActive ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                      isActive ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className="rounded-2xl"
            >
              انصراف
            </Button>
            <Button
              onClick={save}
              disabled={saving || uploading || !label.trim()}
              className="rounded-2xl font-bold"
            >
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
