"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Save } from "lucide-react";
import toast from "react-hot-toast";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  SETTINGS_THEMES,
  type SettingsTheme,
  type SiteSettings,
} from "@/lib/settings/types";

const THEME_LABELS: Record<SettingsTheme, string> = {
  light: "روشن",
  dark: "تیره",
  system: "سیستم",
};

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: SiteSettings;
}) {
  const [settings, setSettings] = React.useState<SiteSettings>(initialSettings);
  const router = useRouter();
  // مرجع آخرین مقدار ذخیره‌شده برای تشخیص تغییر و امکان «بازگردانی».
  const [saved, setSaved] = React.useState<SiteSettings>(initialSettings);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(0); // تعداد آپلودهای درحال‌انجام

  const set = React.useCallback(
    <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
      setSettings((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
    },
    [],
  );

  const isDirty = React.useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(saved),
    [settings, saved],
  );
  const isUploading = uploading > 0;

  const onUploadState = React.useCallback((active: boolean) => {
    setUploading((n) => Math.max(0, n + (active ? 1 : -1)));
  }, []);

  const save = React.useCallback(async () => {
    if (saving || isUploading) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; settings: SiteSettings; message?: string }
        | { ok: false; error?: string }
        | null;

      if (!res.ok || !data || !("ok" in data) || !data.ok) {
        const message =
          (data && "error" in data && data.error) || "ذخیره‌ی تنظیمات ناموفق بود.";
        toast.error(message);
        return;
      }

      setSettings(data.settings);
      setSaved(data.settings);
      router.refresh();
      toast.success(data.message || "تنظیمات ذخیره شد");
    } catch {
      toast.error("ارتباط با سرور ممکن نشد.");
    } finally {
      setSaving(false);
    }
  }, [router, saving, isUploading, settings]);

  const reset = React.useCallback(() => {
    setSettings(saved);
  }, [saved]);

  const saveDisabled = saving || isUploading || !isDirty;

  return (
    <div className="mx-auto max-w-3xl pb-28">
      <AdminPageHeader
        title="تنظیمات سایت"
        description="پیکربندی کلی سامانه، برندینگ، ظاهر و کنترل‌های سیستم"
        action={
          <Button onClick={save} disabled={saveDisabled} className="gap-2">
            <span className="inline-flex h-4 w-4 items-center justify-center">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </span>
            <span>ذخیره</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* ---------------- عمومی ---------------- */}
        <AdminFormSection title="تنظیمات عمومی">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="نام سایت"
              value={settings.siteName}
              onChange={(v) => set("siteName", v)}
              required
            />
            <TextField
              label="ایمیل تماس"
              value={settings.contactEmail}
              onChange={(v) => set("contactEmail", v)}
              dir="ltr"
              placeholder="hello@example.com"
            />
          </div>
          <div className="mt-4">
            <TextArea
              label="توضیح کوتاه سایت"
              value={settings.siteDescription}
              onChange={(v) => set("siteDescription", v)}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="زبان سایت"
              value={settings.siteLanguage}
              onChange={(v) => set("siteLanguage", v)}
              dir="ltr"
              placeholder="fa"
              hint="کد زبان (مثل fa یا en)"
            />
          </div>

          <div className="mt-6 border-t border-border/60 pt-5">
            <h3 className="mb-4 text-sm font-bold text-foreground">سئوی پیش‌فرض</h3>
            <TextField
              label="عنوان سئو"
              value={settings.seoTitle}
              onChange={(v) => set("seoTitle", v)}
            />
            <div className="mt-4">
              <TextArea
                label="توضیحات سئو"
                value={settings.seoDescription}
                onChange={(v) => set("seoDescription", v)}
                hint="توضیح کوتاهی که در نتایج جست‌وجو نمایش داده می‌شود."
              />
            </div>
          </div>
        </AdminFormSection>

        {/* ---------------- برندینگ ---------------- */}
        <AdminFormSection title="برندینگ">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label className="mb-2 block">لوگوی سایت</Label>
              <ImageUploader
                value={settings.logoUrl}
                onChange={(url) => set("logoUrl", url)}
                onUploadStateChange={onUploadState}
                folder="settings"
                variant="square"
                maxSizeKb={1024}
                className="max-w-full"
              />
              <p className="mt-2 text-xs text-muted-foreground">PNG، JPG یا WEBP</p>
            </div>

            <div>
              <Label className="mb-2 block">فاوآیکون</Label>
              <ImageUploader
                value={settings.faviconUrl}
                onChange={(url) => set("faviconUrl", url)}
                onUploadStateChange={onUploadState}
                folder="settings"
                kind="favicon"
                variant="square"
                maxSizeKb={1024}
                className="max-w-full"
              />
              <p className="mt-2 text-xs text-muted-foreground">PNG یا ICO</p>
            </div>

            <div>
              <Label className="mb-2 block">تصویر اشتراک‌گذاری (OG)</Label>
              <ImageUploader
                value={settings.ogImageUrl}
                onChange={(url) => set("ogImageUrl", url)}
                onUploadStateChange={onUploadState}
                folder="settings"
                variant="wide"
                maxSizeKb={1024}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                نسبت ۱۲۰۰×۶۳۰ پیشنهاد می‌شود.
              </p>
            </div>
          </div>
        </AdminFormSection>

        {/* ---------------- ظاهر ---------------- */}
        <AdminFormSection title="ظاهر">
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">تم پیش‌فرض</Label>
              <div className="inline-flex rounded-xl border border-border bg-muted/30 p-1">
                {SETTINGS_THEMES.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => set("defaultTheme", theme)}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                      settings.defaultTheme === theme
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {THEME_LABELS[theme]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">رنگ اصلی</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor || "#2B6252"}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    aria-label="انتخاب رنگ اصلی"
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                  />
                  <Input
                    value={settings.primaryColor}
                    dir="ltr"
                    placeholder="#2B6252"
                    onChange={(e) => set("primaryColor", e.target.value)}
                  />
                </div>
              </div>
              <TextField
                label="فونت"
                value={settings.fontFamily}
                onChange={(v) => set("fontFamily", v)}
                dir="ltr"
                placeholder="Vazirmatn"
                hint="اختیاری — برای توسعه‌ی آینده."
              />
            </div>
          </div>
        </AdminFormSection>

        {/* ---------------- شبکه‌های اجتماعی ---------------- */}
        <AdminFormSection title="شبکه‌های اجتماعی">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="اینستاگرام"
              value={settings.instagram}
              onChange={(v) => set("instagram", v)}
              dir="ltr"
            />
            <TextField
              label="ایکس (توییتر)"
              value={settings.twitter}
              onChange={(v) => set("twitter", v)}
              dir="ltr"
            />
            <TextField
              label="تلگرام"
              value={settings.telegram}
              onChange={(v) => set("telegram", v)}
              dir="ltr"
            />
          </div>
        </AdminFormSection>

        {/* ---------------- سیستم ---------------- */}
        <AdminFormSection title="سیستم">
          <div className="space-y-3">
            <Toggle
              label="ثبت‌نام باز است"
              hint="اگر خاموش شود، کاربران جدید نمی‌توانند ثبت‌نام کنند."
              value={settings.registrationEnabled}
              onChange={(v) => set("registrationEnabled", v)}
            />
            <Toggle
              label="نظرات فعال است"
              hint="امکان ثبت نظر و یادداشت عمومی برای کاربران."
              value={settings.commentsEnabled}
              onChange={(v) => set("commentsEnabled", v)}
            />
            <Toggle
              label="حالت تعمیر"
              hint="نمایش صفحه‌ی تعمیر به کاربران عادی."
              value={settings.maintenanceMode}
              onChange={(v) => set("maintenanceMode", v)}
              danger
            />
          </div>
        </AdminFormSection>
      </div>

      {/* ---------------- نوار ذخیره‌ی چسبان ---------------- */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 transition-all duration-300",
          isDirty ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        <div className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/95 px-4 py-3 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.7)] backdrop-blur-md">
          <span className="text-sm font-medium text-muted-foreground">
            {isUploading ? "در حال آپلود فایل…" : "تغییرات ذخیره‌نشده دارید"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={saving}
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              <span>بازگردانی</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={save}
              disabled={saveDisabled}
              className="gap-1.5"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </span>
              <span>ذخیره‌ی تغییرات</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  dir,
  placeholder,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "ltr" | "rtl";
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">
        {label}
        {required ? <span className="mr-1 text-destructive">*</span> : null}
      </Label>
      <Input
        value={value}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-20"
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
  danger,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-right transition-colors hover:bg-muted/50"
    >
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint ? (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          value
            ? danger
              ? "bg-destructive"
              : "bg-primary"
            : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-all",
            value ? "left-0.5" : "right-0.5",
          )}
        />
      </span>
    </button>
  );
}
