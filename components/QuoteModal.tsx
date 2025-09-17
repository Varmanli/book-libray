"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuoteType } from "@/types";
import toast from "react-hot-toast";

interface QuoteModalProps {
  quote: QuoteType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (quote: QuoteType) => void;
  onDelete: (quoteId: string) => void;
}

export default function QuoteModal({
  quote,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: QuoteModalProps) {
  const [content, setContent] = useState("");
  const [page, setPage] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when modal opens/closes or quote changes
  useState(() => {
    if (quote && isOpen) {
      setContent(quote.content);
      setPage(quote.page || null);
      setIsEditing(false);
      setIsDeleting(false);
    } else if (!isOpen) {
      setContent("");
      setPage(null);
      setIsEditing(false);
      setIsDeleting(false);
    }
  });

  const handleSave = async () => {
    if (!quote || !content.trim()) return;

    try {
      const updatedQuote = {
        ...quote,
        content: content.trim(),
        page: page || null,
      };

      await onSave(updatedQuote);
      onClose();
    } catch (error) {
      toast.error("خطا در ذخیره تغییرات");
    }
  };

  const handleDelete = async () => {
    if (!quote) return;

    try {
      await onDelete(quote.id);
      onClose();
    } catch (error) {
      toast.error("خطا در حذف نقل قول");
    }
  };

  const handlePageChange = (value: string) => {
    const num = parseInt(value);
    setPage(isNaN(num) ? null : num);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isDeleting
              ? "حذف نقل قول"
              : isEditing
              ? "ویرایش نقل قول"
              : "نقل قول"}
          </DialogTitle>
        </DialogHeader>

        {isDeleting ? (
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              آیا از حذف این نقل قول اطمینان دارید؟
            </p>
            <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-sm italic">"{content}"</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="content">متن نقل قول</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن نقل قول را وارد کنید..."
                rows={4}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="page">شماره صفحه (اختیاری)</Label>
              <Input
                id="page"
                type="number"
                value={page || ""}
                onChange={(e) => handlePageChange(e.target.value)}
                placeholder="شماره صفحه"
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {isDeleting ? (
            <>
              <Button variant="outline" onClick={() => setIsDeleting(false)}>
                انصراف
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                حذف
              </Button>
            </>
          ) : isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                انصراف
              </Button>
              <Button onClick={handleSave}>ذخیره</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                بستن
              </Button>
              <Button variant="destructive" onClick={() => setIsDeleting(true)}>
                حذف
              </Button>
              <Button onClick={() => setIsEditing(true)}>ویرایش</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

