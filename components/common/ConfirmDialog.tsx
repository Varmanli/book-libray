"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** دکمه‌ی تأیید قرمز/مخرب باشد (پیش‌فرض true چون بیشتر برای حذف است). */
  destructive?: boolean;
  /**
   * کار async هنگام تأیید. تا پایان آن دیالوگ در حالت بارگذاری می‌ماند و سپس
   * بسته می‌شود. مدیریت خطا/توست داخل خود این تابع انجام شود.
   */
  onConfirm?: () => void | Promise<void>;
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

/** هوک دسترسی به دیالوگ تأیید سراسری. */
export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm باید درون <ConfirmProvider> استفاده شود.");
  }
  return ctx;
}

const DEFAULTS = {
  title: "حذف شود؟",
  description: "این عملیات قابل بازگشت نیست.",
  confirmLabel: "حذف",
  cancelLabel: "انصراف",
  destructive: true,
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmOptions>({});
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const settle = React.useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  const confirm = React.useCallback<ConfirmFn>((opts) => {
    setOptions(opts ?? {});
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleOpenChange = (next: boolean) => {
    // در حین بارگذاری اجازه‌ی بستن (Escape/کلیک بیرون) نمی‌دهیم.
    if (loading || next) return;
    setOpen(false);
    settle(false);
  };

  const handleCancel = () => {
    if (loading) return;
    setOpen(false);
    settle(false);
  };

  const handleConfirm = async () => {
    if (loading) return;
    if (!options.onConfirm) {
      setOpen(false);
      settle(true);
      return;
    }
    setLoading(true);
    try {
      await options.onConfirm();
      settle(true);
    } catch {
      settle(false);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const merged = { ...DEFAULTS, ...options };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{merged.title}</DialogTitle>
            <DialogDescription>{merged.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              {merged.cancelLabel}
            </Button>
            <Button
              type="button"
              variant={merged.destructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {merged.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
