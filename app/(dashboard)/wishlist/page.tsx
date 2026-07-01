"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Pencil,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageLoading } from "@/components/Loading";
import { useConfirm } from "@/components/common/ConfirmDialog";

type Priority =
  | "MUST_HAVE"
  | "WANT_IT"
  | "NICE_TO_HAVE"
  | "IF_EXTRA_MONEY"
  | "NOT_IMPORTANT";

interface WishlistItem {
  id: string;
  title: string;
  author: string;
  publisher?: string | null;
  genre?: string | null;
  translator?: string | null;
  priority: Priority;
  note?: string | null;
  createdAt: string;
}

interface FormData {
  title: string;
  author: string;
  publisher?: string;
  genre?: string;
  translator?: string;
  priority: Priority;
  note?: string;
}

type SortField =
  | "title"
  | "author"
  | "publisher"
  | "genre"
  | "priority"
  | "createdAt";
type SortOrder = "asc" | "desc";

export default function WishlistPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    author: "",
    publisher: "",
    genre: "",
    translator: "",
    priority: "MUST_HAVE",
    note: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const priorities: { value: Priority; label: string }[] = [
    { value: "MUST_HAVE", label: "حتما باید بخرم 🟢" },
    { value: "WANT_IT", label: "خیلی دلم می‌خواد 🔵" },
    { value: "NICE_TO_HAVE", label: "بد نیست داشته باشم 🟡" },
    { value: "IF_EXTRA_MONEY", label: "اگر پول اضافه داشتم 🟠" },
    { value: "NOT_IMPORTANT", label: "فعلا مهم نیست ⚪" },
  ];

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = `/api/wishlist?sortBy=${sortField}&sortOrder=${sortOrder}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "خطا در دریافت لیست");
        setItems([]);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data.wishlist)) {
        setItems(data.wishlist);
      } else {
        toast.error("خطا: پاسخ سرور نامعتبر است");
        setItems([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("ارتباط با سرور برقرار نشد");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [sortField, sortOrder]);

  // ⚡ بارگذاری لیست اولیه
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Get sort icon for a field
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      publisher: "",
      genre: "",
      translator: "",
      priority: "MUST_HAVE",
      note: "",
    });
    setEditingId(null);
  };

  const validateForm = (data: FormData) => {
    if (!data.title.trim() || !data.author.trim()) {
      toast.error("لطفا عنوان و نویسنده را وارد کنید");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm(formData)) return;

    setIsSaving(true);
    try {
      const url = editingId ? `/api/wishlist/${editingId}` : "/api/wishlist";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (res.ok) {
        toast.success(
          editingId ? "ویرایش با موفقیت انجام شد" : "کتاب اضافه شد"
        );
        setOpen(false);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "عملیات ناموفق بود");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطا در ذخیره‌سازی");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: WishlistItem) => {
    setFormData({
      title: item.title ?? "",
      author: item.author ?? "",
      publisher: item.publisher ?? "",
      genre: item.genre ?? "",
      translator: item.translator ?? "",
      priority: item.priority,
      note: item.note ?? "",
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    void confirm({
      title: "حذف کتاب",
      description: "این کتاب از فهرست خرید حذف شود؟ این عملیات قابل بازگشت نیست.",
      onConfirm: async () => {
        setDeletingId(id);
        try {
          const res = await fetch(`/api/wishlist/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) {
            toast.success("کتاب حذف شد.");
            fetchItems();
          } else {
            const err = await res.json().catch(() => ({}));
            toast.error(err?.error || "حذف کتاب ناموفق بود.");
          }
        } catch (err) {
          console.error(err);
          toast.error("خطا در حذف کتاب");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleBuy = async (item: WishlistItem) => {
    try {
      const res = await fetch(`/api/wishlist/${item.id}/buy`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json(); // { bookId: "123" }
        toast.success("کتاب به کتابخانه اضافه شد");

        // اگر لازم دارید، لیست Wishlist را دوباره fetch کنید
        fetchItems?.();

        // هدایت به صفحه Edit همان کتاب
        window.location.href = `/books/edit/${data.bookId}`;
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "خطا در خرید کتاب");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطا در خرید کتاب");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* هدر و دکمه افزودن */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">لیست خرید کتاب</h2>
          <p className="text-foreground mt-1 text-sm">
            مدیریت کتاب‌های مورد علاقه‌تان برای خرید آینده
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              + افزودن کتاب جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-gray-900 text-foreground rounded-lg p-6">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "ویرایش کتاب" : "افزودن کتاب"}{" "}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input
                placeholder="نام کتاب"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
              <Input
                placeholder="نویسنده"
                name="author"
                value={formData.author}
                onChange={handleChange}
              />
              <Input
                placeholder="ناشر"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
              />
              <Input
                placeholder="ژانر"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
              />
              <Input
                placeholder="مترجم"
                name="translator"
                value={formData.translator}
                onChange={handleChange}
              />
              <Select
                value={formData.priority}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: val as Priority,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب اولویت" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}{" "}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="یادداشت کوتاه"
                name="note"
                value={formData.note}
                onChange={handleChange}
              />
              <div className="flex gap-2 mt-3">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving
                    ? editingId
                      ? "در حال ذخیره..."
                      : "در حال افزودن..."
                    : editingId
                    ? "ذخیره تغییرات"
                    : "ذخیره در لیست خرید"}
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-foreground hover:bg-gray-800"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                >
                  انصراف
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* لیست کتاب‌ها */}
      {isLoading ? (
        <PageLoading text="در حال بارگذاری لیست خرید..." />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 p-6 text-center text-foreground">
          <p className="mb-4">
            📚 هیچ کتابی اضافه نشده — لطفاً یک مورد اضافه کنید.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-foreground">
                افزودن کتاب
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse border border-gray-700 text-sm text-foreground">
            <thead className="bg-gray-800 text-foreground">
              <tr>
                {[
                  { key: "title", label: "عنوان" },
                  { key: "author", label: "نویسنده" },
                  { key: "priority", label: "اولویت" },
                  { key: "publisher", label: "ناشر", desktopOnly: true },
                  { key: "genre", label: "ژانر", desktopOnly: true },
                  { key: "translator", label: "مترجم", desktopOnly: true },
                  { key: "note", label: "یادداشت", desktopOnly: true },
                  { key: "createdAt", label: "تاریخ اضافه", desktopOnly: true },
                  { key: "actions", label: "عملیات" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={`border p-3 text-right ${
                      col.key !== "actions"
                        ? "cursor-pointer hover:bg-gray-700 select-none"
                        : ""
                    } ${col.desktopOnly ? "hidden md:table-cell" : ""}`}
                    onClick={() =>
                      col.key !== "actions" && handleSort(col.key as SortField)
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      {col.label}
                      {col.key !== "actions" &&
                        getSortIcon(col.key as SortField)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-700 transition-colors text-xs md:text-sm"
                >
                  <td className="border p-3 font-medium">{item.title}</td>
                  <td className="border p-3">{item.author}</td>
                  <td className="border p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.priority === "MUST_HAVE"
                          ? "bg-green-700 text-green-100"
                          : item.priority === "WANT_IT"
                          ? "bg-blue-700 text-blue-100"
                          : item.priority === "NICE_TO_HAVE"
                          ? "bg-yellow-700 text-yellow-100"
                          : item.priority === "IF_EXTRA_MONEY"
                          ? "bg-orange-700 text-orange-100"
                          : "bg-gray-600 text-foreground"
                      }`}
                    >
                      {priorities.find((p) => p.value === item.priority)?.label}
                    </span>
                  </td>
                  <td className="border p-3 hidden md:table-cell">
                    {item.publisher || "—"}
                  </td>
                  <td className="border p-3 hidden md:table-cell">
                    {item.genre || "—"}
                  </td>
                  <td className="border p-3 hidden md:table-cell">
                    {item.translator || "—"}
                  </td>
                  <td
                    className="border p-3 max-w-xs truncate hidden md:table-cell"
                    title={item.note || ""}
                  >
                    {item.note || "—"}
                  </td>
                  <td className="border p-3 text-sm hidden md:table-cell">
                    {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                  </td>
                  <td className="border p-3 text-center">
                    {/* موبایل: سه نقطه → مودال جزئیات */}
                    <div className="md:hidden">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                          >
                            ⋮
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-gray-900 text-foreground rounded-lg p-6">
                          <DialogHeader>
                            <DialogTitle>جزئیات کتاب</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 text-sm mt-3">
                            <p>
                              <strong>عنوان:</strong> {item.title}
                            </p>
                            <p>
                              <strong>نویسنده:</strong> {item.author}
                            </p>
                            <p>
                              <strong>ناشر:</strong> {item.publisher || "—"}
                            </p>
                            <p>
                              <strong>ژانر:</strong> {item.genre || "—"}
                            </p>
                            <p>
                              <strong>مترجم:</strong> {item.translator || "—"}
                            </p>
                            <p>
                              <strong>اولویت:</strong>{" "}
                              {
                                priorities.find(
                                  (p) => p.value === item.priority
                                )?.label
                              }
                            </p>
                            <p>
                              <strong>یادداشت:</strong> {item.note || "—"}
                            </p>
                            <p>
                              <strong>تاریخ اضافه:</strong>{" "}
                              {new Date(item.createdAt).toLocaleDateString(
                                "fa-IR"
                              )}
                            </p>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBuy(item)}
                              className="bg-green-600 hover:bg-green-700 text-foreground border-green-600"
                            >
                              خرید
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                            >
                              ویرایش
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                            >
                              حذف
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {/* دسکتاپ: دکمه‌های مستقیم */}
                    <div className="hidden md:flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBuy(item)}
                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-foreground border-green-600"
                        title="خرید"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8 p-0"
                        title="ویرایش"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="h-8 w-8 p-0"
                        title="حذف"
                      >
                        {deletingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
