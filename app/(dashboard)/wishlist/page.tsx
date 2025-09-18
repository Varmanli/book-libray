"use client";

import { useState, useEffect, ChangeEvent } from "react";
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
import { Pencil, Check } from "lucide-react";
import toast from "react-hot-toast";

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

export default function WishlistPage() {
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

  const priorities: { value: Priority; label: string }[] = [
    { value: "MUST_HAVE", label: "حتما باید بخرم 🟢" },
    { value: "WANT_IT", label: "خیلی دلم می‌خواد 🔵" },
    { value: "NICE_TO_HAVE", label: "بد نیست داشته باشم 🟡" },
    { value: "IF_EXTRA_MONEY", label: "اگر پول اضافه داشتم 🟠" },
    { value: "NOT_IMPORTANT", label: "فعلا مهم نیست ⚪" },
  ];

  // ⚡ بارگذاری لیست اولیه
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/wishlist", { credentials: "include" });
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

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("آیا از حذف این کتاب مطمئن هستید؟");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/wishlist/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("کتاب حذف شد");
        fetchItems();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "حذف ناموفق بود");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطا در حذف کتاب");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* هدر و دکمه افزودن */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">لیست خرید کتاب</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ افزودن / ویرایش کتاب</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "ویرایش کتاب" : "افزودن کتاب"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
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
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="یادداشت کوتاه"
                name="note"
                value={formData.note}
                onChange={handleChange}
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
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
        <div className="p-6 text-center text-gray-500">در حال بارگذاری...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
          <p className="mb-4 text-gray-600">
            📚 هیچ کتابی اضافه نشده — لطفاً یک مورد اضافه کنید.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>افزودن کتاب</Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className="border p-2">عنوان</th>
                <th className="border p-2">نویسنده</th>
                <th className="border p-2">ناشر</th>
                <th className="border p-2">ژانر</th>
                <th className="border p-2">مترجم</th>
                <th className="border p-2">اولویت</th>
                <th className="border p-2">یادداشت</th>
                <th className="border p-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border p-2">{item.title}</td>
                  <td className="border p-2">{item.author}</td>
                  <td className="border p-2">{item.publisher || "—"}</td>
                  <td className="border p-2">{item.genre || "—"}</td>
                  <td className="border p-2">{item.translator || "—"}</td>
                  <td className="border p-2">
                    {priorities.find((p) => p.value === item.priority)?.label}
                  </td>
                  <td className="border p-2">{item.note || "—"}</td>
                  <td className="border p-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      <Check className="w-4 h-4" />{" "}
                      {deletingId === item.id ? "در حال حذف..." : "خریدمش"}
                    </Button>
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
