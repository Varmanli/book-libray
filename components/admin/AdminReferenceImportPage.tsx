"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileJson,
  ImagePlus,
  Info,
  Loader2,
  Upload,
  UploadCloud,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ImportPreviewItem = {
  type: "AUTHOR" | "TRANSLATOR" | "PUBLISHER";
  name: string;
  slug: string | null;
  status: "create" | "update" | "invalid";
  matchedReferenceId: string | null;
  warnings: string[];
  errors: string[];
};

type ImportPreviewResponse = {
  total: number;
  valid: number;
  invalid: number;
  authors: number;
  translators: number;
  publishers: number;
  willCreate: number;
  willUpdate: number;
  items: ImportPreviewItem[];
  error?: string;
};

type ApplyResponse = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  items: Array<{
    type: "AUTHOR" | "TRANSLATOR" | "PUBLISHER";
    name: string;
    slug: string | null;
    status: "created" | "updated" | "skipped" | "failed";
    message?: string;
  }>;
  error?: string;
};

type MediaPreviewItem = {
  filename: string;
  relativePath: string | null;
  matchedReferenceId: string | null;
  referenceName: string | null;
  type: "AUTHOR" | "TRANSLATOR" | "PUBLISHER" | null;
  status: "matched" | "unmatched" | "ambiguous";
  candidates?: Array<{
    referenceId: string;
    referenceName: string;
    type: "AUTHOR" | "TRANSLATOR" | "PUBLISHER";
  }>;
};

type MediaPreviewResponse = {
  totalFiles: number;
  matched: number;
  unmatched: number;
  ambiguous: number;
  items: MediaPreviewItem[];
  error?: string;
};

type MediaUploadResponse = {
  imagesUploaded: number;
  unmatchedImages: number;
  uploaded: Array<{ filename: string; referenceId: string; imageUrl: string }>;
  skipped: Array<{ filename: string; reason: string }>;
  error?: string;
};

type MediaFileEntry = {
  file: File;
  relativePath: string | null;
};

type ClientProfile = {
  type?: string | null;
  name?: string | null;
  originalName?: string | null;
  slug?: string | null;
};

const JSON_ACCEPT = ".json,application/json";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getTypeLabel(type: "AUTHOR" | "TRANSLATOR" | "PUBLISHER") {
  if (type === "AUTHOR") return "نویسنده";
  if (type === "TRANSLATOR") return "مترجم";
  return "ناشر";
}

function profileLookupKey(item: {
  type?: string | null;
  name?: string | null;
  slug?: string | null;
}) {
  return `${item.type ?? ""}::${item.name ?? ""}::${item.slug ?? ""}`;
}

function uniqueRenderKeys<T>(items: T[], identity: (item: T) => string): string[] {
  const occurrences = new Map<string, number>();
  return items.map((item) => {
    const base = identity(item);
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    return `${base}::${occurrence}`;
  });
}

export default function AdminReferenceImportPage() {
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [profiles, setProfiles] = useState<unknown[] | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonDragging, setJsonDragging] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyResponse | null>(null);

  const [mediaFiles, setMediaFiles] = useState<MediaFileEntry[]>([]);
  const [mediaSelectionMessage, setMediaSelectionMessage] = useState<string | null>(null);
  const [mediaDragging, setMediaDragging] = useState(false);
  const [mediaPreviewLoading, setMediaPreviewLoading] = useState(false);
  const [mediaUploadLoading, setMediaUploadLoading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<MediaPreviewResponse | null>(null);
  const [mediaResult, setMediaResult] = useState<MediaUploadResponse | null>(null);

  useEffect(() => {
    folderInputRef.current?.setAttribute("webkitdirectory", "");
    folderInputRef.current?.setAttribute("directory", "");
  }, []);

  const clientProfiles = useMemo(() => {
    if (!Array.isArray(profiles)) return new Map<string, ClientProfile>();
    return new Map(
      profiles
        .filter((item): item is ClientProfile => Boolean(item && typeof item === "object"))
        .map((item) => [profileLookupKey(item), item]),
    );
  }, [profiles]);

  const canRunPreview = Boolean(profiles) && !previewLoading && !applyLoading;
  const canApply = Boolean(preview) && Boolean(profiles) && !applyLoading && !previewLoading;
  const canPreviewMedia =
    mediaFiles.length > 0 && !mediaPreviewLoading && !mediaUploadLoading;
  const canUploadMedia =
    Boolean(mediaPreview) && !mediaUploadLoading && !mediaPreviewLoading;
  const previewItemKeys = useMemo(
    () => uniqueRenderKeys(
      preview?.items ?? [],
      (item) => `${item.type}::${item.slug ?? ""}::${item.name}`,
    ),
    [preview],
  );
  const mediaPreviewItemKeys = useMemo(
    () => uniqueRenderKeys(
      mediaPreview?.items ?? [],
      (item) => `${item.relativePath ?? ""}::${item.filename}`,
    ),
    [mediaPreview],
  );

  async function readJsonFile(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error("فایل JSON باید آرایه‌ای از پروفایل‌ها باشد.");
    }
    return parsed;
  }

  async function handleJsonSelect(file: File | null) {
    setPreview(null);
    setApplyResult(null);
    setJsonError(null);
    setJsonFile(file);
    setProfiles(null);

    if (!file) return;

    if (!/\.json$/i.test(file.name) && file.type !== "application/json") {
      setJsonFile(null);
      setJsonError("فرمت فایل معتبر نیست. فقط فایل JSON قابل قبول است.");
      return;
    }

    try {
      const parsed = await readJsonFile(file);
      setProfiles(parsed);
    } catch (error) {
      setJsonFile(null);
      setJsonError(
        error instanceof Error ? error.message : "خواندن فایل JSON ناموفق بود.",
      );
    }
  }

  async function runPreview() {
    if (!profiles) {
      toast.error("ابتدا فایل JSON معتبر را انتخاب کنید.");
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch("/api/admin/references/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profiles }),
      });
      const data = (await res.json()) as ImportPreviewResponse;
      if (!res.ok) {
        toast.error(data.error || "پیش‌نمایش فایل ناموفق بود.");
        return;
      }
      setPreview(data);
      toast.success("بررسی فایل انجام شد.");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function applyImport() {
    if (!profiles) {
      toast.error("ابتدا فایل JSON معتبر را انتخاب کنید.");
      return;
    }

    setApplyLoading(true);
    try {
      const res = await fetch("/api/admin/references/import/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profiles, overwrite }),
      });
      const data = (await res.json()) as ApplyResponse;
      if (!res.ok) {
        toast.error(data.error || "ثبت اطلاعات ناموفق بود.");
        return;
      }
      setApplyResult(data);
      toast.success("اطلاعات پروفایل‌ها ثبت شد.");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setApplyLoading(false);
    }
  }

  function collectMediaFiles(list: FileList | null) {
    if (!list) return;

    const accepted: MediaFileEntry[] = [];
    let ignored = 0;

    for (const file of Array.from(list)) {
      if (!/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
        ignored += 1;
        continue;
      }

      accepted.push({
        file,
        relativePath:
          "webkitRelativePath" in file &&
          typeof file.webkitRelativePath === "string" &&
          file.webkitRelativePath.trim()
            ? file.webkitRelativePath
            : null,
      });
    }

    setMediaFiles(accepted);
    setMediaPreview(null);
    setMediaResult(null);
    setMediaSelectionMessage(
      ignored > 0
        ? `${ignored.toLocaleString("fa-IR")} فایل غیرتصویری نادیده گرفته شد.`
        : null,
    );
  }

  async function previewMedia() {
    if (mediaFiles.length === 0) {
      toast.error("ابتدا فایل یا پوشه‌ی تصاویر را انتخاب کنید.");
      return;
    }

    setMediaPreviewLoading(true);
    try {
      const formData = new FormData();
      mediaFiles.forEach((entry) => formData.append("files", entry.file));
      formData.set(
        "paths",
        JSON.stringify(mediaFiles.map((entry) => entry.relativePath ?? "")),
      );

      const res = await fetch("/api/admin/references/media/preview", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = (await res.json()) as MediaPreviewResponse;
      if (!res.ok) {
        toast.error(data.error || "پیش‌نمایش تصاویر ناموفق بود.");
        return;
      }
      setMediaPreview(data);
      toast.success("بررسی تصاویر انجام شد.");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setMediaPreviewLoading(false);
    }
  }

  async function uploadMedia() {
    if (!mediaPreview) {
      toast.error("ابتدا پیش‌نمایش تصاویر را اجرا کنید.");
      return;
    }

    const matchedEntries = mediaPreview.items
      .map((item, index) => ({ item, entry: mediaFiles[index] }))
      .filter(
        (row): row is { item: MediaPreviewItem; entry: MediaFileEntry } =>
          Boolean(row.entry) &&
          row.item.status === "matched" &&
          Boolean(row.item.matchedReferenceId),
      );

    if (matchedEntries.length === 0) {
      toast.error("فایل قابل‌اتصال دقیقی برای آپلود وجود ندارد.");
      return;
    }

    setMediaUploadLoading(true);
    try {
      const formData = new FormData();
      matchedEntries.forEach((row) => formData.append("files", row.entry.file));
      formData.set(
        "matches",
        JSON.stringify(
          matchedEntries.map((row) => ({
            filename: row.entry.file.name,
            relativePath: row.entry.relativePath,
            referenceId: row.item.matchedReferenceId,
          })),
        ),
      );

      const res = await fetch("/api/admin/references/media/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = (await res.json()) as MediaUploadResponse;
      if (!res.ok) {
        toast.error(data.error || "آپلود تصاویر ناموفق بود.");
        return;
      }
      setMediaResult(data);
      toast.success("تصاویر آپلود و متصل شدند.");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setMediaUploadLoading(false);
    }
  }

  const mediaMatchedCount = mediaPreview?.matched ?? 0;
  const mediaUnknownCount = mediaPreview?.ambiguous ?? 0;
  const mediaUnmatchedCount = mediaPreview?.unmatched ?? 0;
  const mediaUploadedCount = mediaResult?.imagesUploaded ?? 0;
  const mediaErrorCount = mediaResult?.skipped.length ?? 0;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden rounded-[2rem] border-border/70 bg-card/80 shadow-[0_24px_90px_-70px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/25 to-transparent" />

        <CardHeader className="relative">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                <FileJson className="h-3.5 w-3.5" />
                ورود تکمیلی رفرنس‌ها
              </div>

              <CardTitle className="text-xl font-black">
                ایمپورت پروفایل نویسنده، مترجم و ناشر
              </CardTitle>

              <CardDescription className="mt-2 max-w-3xl leading-7">
                فایل JSON پروفایل‌ها را بررسی و ثبت کنید، سپس تصویر نویسنده‌ها،
                مترجم‌ها یا لوگوی ناشرها را آپلود و متصل کنید.
              </CardDescription>

              <div className="mt-4 inline-flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3 text-sm leading-7 text-primary">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  این بخش فقط اطلاعات تکمیلی رفرنس‌ها را ثبت می‌کند و ایمپورت
                  کتاب‌ها را تغییر نمی‌دهد.
                </span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1">
              {[
                "۱. فایل JSON را انتخاب کن",
                "۲. بررسی کن و ثبت اطلاعات را بزن",
                "۳. تصاویر را انتخاب کن و آپلود را انجام بده",
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-2xl border border-border/70 bg-background/55 px-4 py-3 text-xs font-bold text-muted-foreground"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.9rem] border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base font-black">
              ۱. بررسی و ثبت فایل JSON
            </CardTitle>
            <CardDescription className="leading-7">
              فایل JSON شامل پروفایل نویسنده‌ها، مترجم‌ها و ناشرها را انتخاب کنید.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <input
              id="reference-json-file"
              type="file"
              accept={JSON_ACCEPT}
              className="sr-only"
              onChange={(event) => void handleJsonSelect(event.target.files?.[0] ?? null)}
            />

            <label
              htmlFor="reference-json-file"
              onDragEnter={(event) => {
                event.preventDefault();
                setJsonDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setJsonDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                setJsonDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setJsonDragging(false);
                void handleJsonSelect(event.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "block cursor-pointer rounded-[1.7rem] border-2 border-dashed p-5 transition-colors",
                jsonDragging
                  ? "border-primary/35 bg-primary/10"
                  : "border-border/80 bg-card/70 hover:border-primary/20 hover:bg-primary/[0.04]",
              )}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">
                      فایل JSON را اینجا رها کن
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      یا برای انتخاب فایل کلیک کن. فقط فایل JSON پذیرفته می‌شود.
                    </p>
                  </div>
                </div>

                <div className="rounded-full border border-border/70 bg-background/55 px-3 py-1 text-xs font-bold text-muted-foreground">
                  Drag & Drop
                </div>
              </div>
            </label>

            {jsonFile ? (
              <div className="rounded-[1.35rem] border border-border/70 bg-card/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      <FileJson className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate" dir="ltr">
                        {jsonFile.name}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      {formatFileSize(jsonFile.size)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void runPreview()}
                      disabled={!canRunPreview}
                      className="h-10 rounded-2xl border-border/80 bg-background/60"
                    >
                      <LoadingButtonContent
                        loading={previewLoading}
                        loadingLabel="در حال بررسی فایل JSON..."
                        label="بررسی فایل"
                      />
                    </Button>

                    <Button
                      type="button"
                      onClick={() => void applyImport()}
                      disabled={!canApply}
                      className="h-10 rounded-2xl"
                    >
                      <LoadingButtonContent
                        loading={applyLoading}
                        loadingLabel="در حال ثبت اطلاعات پروفایل‌ها..."
                        label="ثبت اطلاعات"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<FileJson className="h-5 w-5" />}
                title="هنوز فایلی انتخاب نشده است."
                description="بعد از انتخاب فایل JSON، نتیجه‌ی بررسی اینجا نمایش داده می‌شود."
              />
            )}

            {jsonError ? (
              <Notice tone="danger" message={jsonError} />
            ) : null}

            <label className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/55 px-4 py-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(event) => setOverwrite(event.target.checked)}
              />
              بازنویسی فیلدهای غیرخالی
            </label>

            {preview ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard label="کل پروفایل‌ها" value={preview.total} tone="default" />
                  <SummaryCard label="معتبر" value={preview.valid} tone="success" />
                  <SummaryCard
                    label="نامعتبر"
                    value={preview.invalid}
                    tone={preview.invalid > 0 ? "danger" : "default"}
                  />
                  <SummaryCard label="نویسنده" value={preview.authors} tone="default" />
                  <SummaryCard label="مترجم" value={preview.translators} tone="default" />
                  <SummaryCard label="ناشر" value={preview.publishers} tone="default" />
                  <SummaryCard label="ایجاد می‌شود" value={preview.willCreate} tone="default" />
                  <SummaryCard
                    label="به‌روزرسانی می‌شود"
                    value={preview.willUpdate}
                    tone="success"
                  />
                </div>

                <div className="space-y-3">
                  {preview.items.map((item, index) => {
                    const raw = clientProfiles.get(profileLookupKey(item));
                    return (
                      <div
                        key={previewItemKeys[index]}
                        className="rounded-[1.6rem] border border-border/70 bg-background/55 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <TypeBadge type={item.type} />
                              <p className="text-sm font-black text-foreground">
                                {item.name}
                              </p>
                              <StateBadge
                                tone={
                                  item.status === "invalid"
                                    ? "danger"
                                    : item.status === "update"
                                      ? "success"
                                      : "default"
                                }
                                label={
                                  item.status === "create"
                                    ? "ایجاد می‌شود"
                                    : item.status === "update"
                                      ? "به‌روزرسانی می‌شود"
                                      : "نامعتبر"
                                }
                              />
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {raw?.originalName ? (
                                <span dir="ltr" className="rounded-full border border-border/70 bg-card/70 px-3 py-1">
                                  {raw.originalName}
                                </span>
                              ) : null}
                              {item.slug ? (
                                <span
                                  dir="ltr"
                                  className="rounded-full border border-border/70 bg-card/70 px-3 py-1 font-mono"
                                >
                                  {item.slug}
                                </span>
                              ) : null}
                            </div>

                            {item.warnings.map((warning, warningIndex) => (
                              <Notice
                                key={`${previewItemKeys[index]}::warning::${warning}::${warningIndex}`}
                                tone="warning"
                                message={warning}
                              />
                            ))}
                            {item.errors.map((error, errorIndex) => (
                              <Notice
                                key={`${previewItemKeys[index]}::error::${error}::${errorIndex}`}
                                tone="danger"
                                message={error}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : jsonFile ? (
              <EmptyState
                icon={<Info className="h-5 w-5" />}
                title="بعد از بررسی فایل، نتیجه اینجا نمایش داده می‌شود."
                description="وضعیت ایجاد یا به‌روزرسانی هر پروفایل را بعد از اجرای بررسی می‌بینی."
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base font-black">
              ۲. آپلود تصویر و لوگو
            </CardTitle>
            <CardDescription className="leading-7">
              تصاویر نویسنده‌ها، مترجم‌ها یا لوگوی ناشرها را انتخاب کنید تا بر
              اساس imageFilename یا slug مچ شوند.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setMediaDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setMediaDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                setMediaDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setMediaDragging(false);
                collectMediaFiles(event.dataTransfer.files);
              }}
              className={cn(
                "rounded-[1.7rem] border-2 border-dashed p-5 transition-colors",
                mediaDragging
                  ? "border-primary/35 bg-primary/10"
                  : "border-border/80 bg-card/70 hover:border-primary/20 hover:bg-primary/[0.04]",
              )}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">
                      تصاویر را اینجا رها کن
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      فرمت‌های مجاز: JPG، PNG، WEBP. می‌توانی فایل یا پوشه انتخاب کنی.
                    </p>
                  </div>
                </div>

                <div className="rounded-full border border-border/70 bg-background/55 px-3 py-1 text-xs font-bold text-muted-foreground">
                  Drag & Drop
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="outline" className="h-10 rounded-2xl border-border/80 bg-background/60">
                <label htmlFor="reference-image-files">
                  <FileImage className="h-4 w-4" />
                  انتخاب فایل‌ها
                </label>
              </Button>
              <input
                id="reference-image-files"
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                className="sr-only"
                onChange={(event) => collectMediaFiles(event.target.files)}
              />

              <Button asChild variant="outline" className="h-10 rounded-2xl border-border/80 bg-background/60">
                <label htmlFor="reference-image-folder">
                  <UploadCloud className="h-4 w-4" />
                  انتخاب پوشه
                </label>
              </Button>
              <input
                id="reference-image-folder"
                ref={folderInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                className="sr-only"
                onChange={(event) => collectMediaFiles(event.target.files)}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => void previewMedia()}
                disabled={!canPreviewMedia}
                className="h-10 rounded-2xl border-border/80 bg-background/60"
              >
                <LoadingButtonContent
                  loading={mediaPreviewLoading}
                  loadingLabel="در حال بررسی تصاویر..."
                  label="بررسی تصاویر"
                />
              </Button>

              <Button
                type="button"
                onClick={() => void uploadMedia()}
                disabled={!canUploadMedia}
                className="h-10 rounded-2xl"
              >
                <LoadingButtonContent
                  loading={mediaUploadLoading}
                  loadingLabel="در حال آپلود و اتصال تصاویر..."
                  label="آپلود و اتصال تصاویر"
                />
              </Button>
            </div>

            {mediaFiles.length > 0 ? (
              <div className="rounded-[1.35rem] border border-border/70 bg-card/70 p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">
                    {mediaFiles.length.toLocaleString("fa-IR")} فایل انتخاب شد
                  </span>
                  <span>•</span>
                  <span>نمونه: <span dir="ltr">{mediaFiles[0]?.file.name}</span></span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<ImagePlus className="h-5 w-5" />}
                title="هنوز فایلی انتخاب نشده است."
                description="بعد از انتخاب تصاویر، وضعیت تطبیق اینجا نمایش داده می‌شود. برای آپلود گروهی، بهتر است imageFilename هر پروفایل یکتا باشد؛ مثل albert-camus.jpg یا roozaneh.jpg."
              />
            )}

            {mediaSelectionMessage ? (
              <Notice tone="warning" message={mediaSelectionMessage} />
            ) : null}

            {mediaPreview ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <SummaryCard label="کل فایل‌ها" value={mediaPreview.totalFiles} tone="default" />
                  <SummaryCard label="مچ‌شده" value={mediaMatchedCount} tone="success" />
                  <SummaryCard
                    label="نامشخص"
                    value={mediaUnknownCount}
                    tone={mediaUnknownCount > 0 ? "warning" : "default"}
                  />
                  <SummaryCard
                    label="بدون تطبیق"
                    value={mediaUnmatchedCount}
                    tone={mediaUnmatchedCount > 0 ? "danger" : "default"}
                  />
                  <SummaryCard label="آپلود شده" value={mediaUploadedCount} tone="success" />
                  <SummaryCard
                    label="خطا"
                    value={mediaErrorCount}
                    tone={mediaErrorCount > 0 ? "danger" : "default"}
                  />
                </div>

                <div className="space-y-3">
                  {mediaPreview.items.map((item, index) => (
                    <div
                      key={mediaPreviewItemKeys[index]}
                      className="rounded-[1.6rem] border border-border/70 bg-background/55 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.type ? <TypeBadge type={item.type} /> : null}
                            <p dir="ltr" className="text-sm font-black text-foreground">
                              {item.relativePath || item.filename}
                            </p>
                            <StateBadge
                              tone={
                                item.status === "matched"
                                  ? "success"
                                  : item.status === "ambiguous"
                                    ? "warning"
                                    : "danger"
                              }
                              label={
                                item.status === "matched"
                                  ? "تطبیق دقیق"
                                  : item.status === "ambiguous"
                                    ? "نامشخص"
                                    : "بدون تطبیق"
                              }
                            />
                          </div>

                          {item.referenceName ? (
                            <p className="text-xs leading-6 text-muted-foreground">
                              مرجع تطبیق‌یافته: {item.referenceName}
                            </p>
                          ) : null}

                          {item.candidates?.length ? (
                            <Notice
                              tone="warning"
                              message={`چند مرجع ممکن پیدا شد: ${item.candidates
                                .map((candidate) => candidate.referenceName)
                                .join("، ")}`}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : mediaFiles.length > 0 ? (
              <EmptyState
                icon={<Info className="h-5 w-5" />}
                title="بعد از انتخاب تصاویر، وضعیت تطبیق اینجا نمایش داده می‌شود."
                description="بعد از اجرای بررسی تصاویر، مچ دقیق، نامشخص و بدون تطبیق را می‌بینی."
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      {(applyResult || mediaResult) ? (
        <Card className="rounded-[1.9rem] border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base font-black">گزارش نهایی</CardTitle>
            <CardDescription>خروجی آخرین ثبت اطلاعات و آپلود تصاویر</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="پروفایل ایجاد شد" value={applyResult?.created ?? 0} tone="success" />
              <SummaryCard label="پروفایل به‌روزرسانی شد" value={applyResult?.updated ?? 0} tone="success" />
              <SummaryCard
                label="مورد رد شد"
                value={applyResult?.skipped ?? 0}
                tone={(applyResult?.skipped ?? 0) > 0 ? "warning" : "default"}
              />
              <SummaryCard
                label="خطا رخ داد"
                value={applyResult?.failed ?? 0}
                tone={(applyResult?.failed ?? 0) > 0 ? "danger" : "default"}
              />
              <SummaryCard label="تصویر آپلود و متصل شد" value={mediaUploadedCount} tone="success" />
              <SummaryCard
                label="فایل بدون تطبیق ماند"
                value={mediaResult?.unmatchedImages ?? 0}
                tone={(mediaResult?.unmatchedImages ?? 0) > 0 ? "warning" : "default"}
              />
              <SummaryCard
                label="خطای رسانه"
                value={mediaErrorCount}
                tone={mediaErrorCount > 0 ? "danger" : "default"}
              />
            </div>

            {applyResult ? (
              <div className="space-y-2">
                <Notice
                  tone="success"
                  message={`${applyResult.created.toLocaleString("fa-IR")} پروفایل ایجاد شد و ${applyResult.updated.toLocaleString("fa-IR")} پروفایل به‌روزرسانی شد.`}
                />
                {(applyResult.failed > 0 || applyResult.skipped > 0) ? (
                  <Notice
                    tone={applyResult.failed > 0 ? "danger" : "warning"}
                    message={`${applyResult.skipped.toLocaleString("fa-IR")} مورد رد شد و ${applyResult.failed.toLocaleString("fa-IR")} خطا رخ داد.`}
                  />
                ) : null}
              </div>
            ) : null}

            {mediaResult ? (
              <div className="space-y-2">
                <Notice
                  tone="success"
                  message={`${mediaUploadedCount.toLocaleString("fa-IR")} تصویر آپلود و متصل شد.`}
                />
                {(mediaResult.unmatchedImages > 0 || mediaErrorCount > 0) ? (
                  <Notice
                    tone={mediaErrorCount > 0 ? "danger" : "warning"}
                    message={`${mediaResult.unmatchedImages.toLocaleString("fa-IR")} فایل بدون تطبیق ماند و ${mediaErrorCount.toLocaleString("fa-IR")} خطا رخ داد.`}
                  />
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function LoadingButtonContent({
  loading,
  loadingLabel,
  label,
}: {
  loading: boolean;
  loadingLabel: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex h-4 w-4 items-center justify-center">
        {loading ? (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin"
            aria-hidden="true"
          />
        ) : null}
      </span>
      <span>{loading ? loadingLabel : label}</span>
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.55rem] border border-dashed border-border/75 bg-background/50 px-4 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-card/70 text-primary">
        {icon}
      </div>
      <p className="mt-4 text-sm font-black text-foreground">{title}</p>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function TypeBadge({
  type,
}: {
  type: "AUTHOR" | "TRANSLATOR" | "PUBLISHER";
}) {
  return (
    <span className="rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[11px] font-black text-muted-foreground">
      {getTypeLabel(type)}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "warning" | "danger";
}) {
  const className =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10"
      : tone === "warning"
        ? "border-amber-500/25 bg-amber-500/10"
        : tone === "danger"
          ? "border-rose-500/25 bg-rose-500/10"
          : "border-border/70 bg-card/80";

  return (
    <div className={cn("rounded-[1.5rem] border p-4", className)}>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-foreground">
        {value.toLocaleString("fa-IR")}
      </p>
    </div>
  );
}

function StateBadge({
  label,
  tone,
}: {
  label: string;
  tone: "default" | "success" | "warning" | "danger";
}) {
  const className =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : tone === "warning"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : tone === "danger"
          ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400"
          : "border-primary/20 bg-primary/10 text-primary";

  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-black",
        className,
      )}
    >
      {label}
    </span>
  );
}

function Notice({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "warning" | "danger";
}) {
  const Icon =
    tone === "danger" ? AlertCircle : tone === "warning" ? Info : CheckCircle2;

  const className =
    tone === "danger"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
      : tone === "warning"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-6",
        className,
      )}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
