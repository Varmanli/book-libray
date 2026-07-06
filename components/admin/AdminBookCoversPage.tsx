"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/common/ConfirmDialog";
import type {
  AdminBookCoverRow,
  BulkCoverPreviewResult,
  CoverStatus,
} from "@/lib/admin/book-covers.shared";
import {
  COVER_UPLOAD_MAX_BYTES,
  COVER_UPLOAD_MAX_LABEL,
} from "@/lib/admin/book-covers.shared";
import { validateImageFile } from "@/lib/upload";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholder-cover.svg";

type CoverListResponse = {
  items: AdminBookCoverRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  recentImportDays: number;
};

type SingleFileState = {
  file: File;
  previewUrl: string;
  error?: string | null;
};

type BulkSelectionMeta = {
  ignoredNonImageCount: number;
  ignoredOversizeCount: number;
  duplicateBasenameCount: number;
  duplicateBasenames: string[];
};

type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  fullPath?: string;
  name: string;
};

type FileSystemFileEntryLike = FileSystemEntryLike & {
  isFile: true;
  file: (callback: (file: File) => void, errorCallback?: (error: Error) => void) => void;
};

type FileSystemDirectoryEntryLike = FileSystemEntryLike & {
  isDirectory: true;
  createReader: () => {
    readEntries: (
      successCallback: (entries: FileSystemEntryLike[]) => void,
      errorCallback?: (error: Error) => void,
    ) => void;
  };
};

type DragDataTransferItem = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getFileExtension(name: string) {
  const match = name.toLowerCase().match(/(\.[a-z0-9]+)$/i);
  return match?.[1] ?? "";
}

function isAllowedCoverImage(file: File) {
  const type = file.type.toLowerCase();
  if (type === "image/jpeg" || type === "image/png" || type === "image/webp") {
    return true;
  }

  const extension = getFileExtension(file.name);
  return [".jpg", ".jpeg", ".png", ".webp"].includes(extension);
}

function basename(name: string) {
  return name.split(/[\\/]/).pop() ?? name;
}

async function readFileEntry(entry: FileSystemFileEntryLike): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

async function readDirectoryEntries(
  directory: FileSystemDirectoryEntryLike,
): Promise<FileSystemEntryLike[]> {
  const reader = directory.createReader();
  const entries: FileSystemEntryLike[] = [];

  while (true) {
    const batch = await new Promise<FileSystemEntryLike[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (batch.length === 0) break;
    entries.push(...batch);
  }

  return entries;
}

async function collectFilesFromEntry(entry: FileSystemEntryLike): Promise<File[]> {
  if (entry.isFile) {
    return [await readFileEntry(entry as FileSystemFileEntryLike)];
  }

  if (!entry.isDirectory) return [];

  const nested = await readDirectoryEntries(entry as FileSystemDirectoryEntryLike);
  const files = await Promise.all(nested.map((child) => collectFilesFromEntry(child)));
  return files.flat();
}

function statusMeta(status: CoverStatus) {
  switch (status) {
    case "uploaded":
      return {
        label: "آپلود شد",
        className:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };
    case "ready":
      return {
        label: "آماده اتصال",
        className:
          "border-primary/20 bg-primary/10 text-primary",
      };
    case "unknown":
      return {
        label: "نامشخص",
        className:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        label: "بدون کاور",
        className:
          "border-border/70 bg-background/60 text-muted-foreground",
      };
  }
}

function buildCoverListQuery(params: {
  q: string;
  page: number;
  onlyMissing: boolean;
  recentOnly: boolean;
}) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: "24",
    missing: String(params.onlyMissing),
    recent: String(params.recentOnly),
  });

  if (params.q.trim()) search.set("q", params.q.trim());
  return search.toString();
}

export default function AdminBookCoversPage() {
  const confirm = useConfirm();

  const [rows, setRows] = useState<AdminBookCoverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recentImportDays, setRecentImportDays] = useState(30);
  const [q, setQ] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [recentOnly, setRecentOnly] = useState(false);

  const [singleFiles, setSingleFiles] = useState<Record<string, SingleFileState>>(
    {},
  );
  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});
  const [singleErrors, setSingleErrors] = useState<Record<string, string | null>>({});

  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkSelectionMeta, setBulkSelectionMeta] = useState<BulkSelectionMeta>({
    ignoredNonImageCount: 0,
    ignoredOversizeCount: 0,
    duplicateBasenameCount: 0,
    duplicateBasenames: [],
  });
  const [bulkPreview, setBulkPreview] = useState<BulkCoverPreviewResult | null>(
    null,
  );
  const [bulkPreviewLoading, setBulkPreviewLoading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkDragging, setBulkDragging] = useState(false);
  const [replaceExistingBulk, setReplaceExistingBulk] = useState(false);
  const singleFilesRef = useRef(singleFiles);
  const bulkFolderInputRef = useRef<HTMLInputElement>(null);

  const queryString = useMemo(
    () => buildCoverListQuery({ q, page, onlyMissing, recentOnly }),
    [onlyMissing, page, q, recentOnly],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/book-covers?${queryString}`, {
        credentials: "include",
      });
      const data = (await res.json()) as CoverListResponse & {
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error || "بارگذاری فهرست کاورها ناموفق بود.");
        return;
      }

      setRows(data.items ?? []);
      setTotalPages(data.totalPages ?? 1);
      setRecentImportDays(data.recentImportDays ?? 30);
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, onlyMissing, recentOnly]);

  useEffect(() => {
    singleFilesRef.current = singleFiles;
  }, [singleFiles]);

  useEffect(() => {
    bulkFolderInputRef.current?.setAttribute("webkitdirectory", "");
    bulkFolderInputRef.current?.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    return () => {
      Object.values(singleFilesRef.current).forEach((state) =>
        URL.revokeObjectURL(state.previewUrl),
      );
    };
  }, []);

  const fetchBulkPreview = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        setBulkPreview(null);
        return;
      }

      setBulkPreviewLoading(true);
      try {
        const res = await fetch("/api/admin/book-covers/bulk-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            filenames: files.map((file) => file.name),
            onlyMissing: !replaceExistingBulk,
          }),
        });
        const data = (await res.json()) as BulkCoverPreviewResult & {
          error?: string;
        };

        if (!res.ok) {
          toast.error(data.error || "پیش‌نمایش مچ فایل‌ها ناموفق بود.");
          return;
        }

        setBulkPreview(data);
      } catch {
        toast.error("ارتباط با سرور برقرار نشد.");
      } finally {
        setBulkPreviewLoading(false);
      }
    },
    [replaceExistingBulk],
  );

  useEffect(() => {
    void fetchBulkPreview(bulkFiles);
  }, [bulkFiles, fetchBulkPreview]);

  const applyBulkSelection = useCallback((incomingFiles: File[]) => {
    const accepted: File[] = [];
    let ignoredNonImageCount = 0;
    let ignoredOversizeCount = 0;
    let duplicateBasenameCount = 0;
    const duplicateBasenames: string[] = [];
    const seenBasenames = new Set<string>();

    for (const file of incomingFiles) {
      const normalizedName = basename(file.name);
      if (!isAllowedCoverImage(file)) {
        ignoredNonImageCount += 1;
        continue;
      }

      const validationError = validateImageFile(file, COVER_UPLOAD_MAX_BYTES);
      if (validationError) {
        ignoredOversizeCount += 1;
        continue;
      }

      const dedupeKey = normalizedName.toLowerCase();
      if (seenBasenames.has(dedupeKey)) {
        duplicateBasenameCount += 1;
        duplicateBasenames.push(normalizedName);
        continue;
      }

      seenBasenames.add(dedupeKey);

      const normalizedFile =
        file.name === normalizedName
          ? file
          : new File([file], normalizedName, {
              type: file.type,
              lastModified: file.lastModified,
            });

      accepted.push(normalizedFile);
    }

    setBulkFiles(accepted);
    setBulkSelectionMeta({
      ignoredNonImageCount,
      ignoredOversizeCount,
      duplicateBasenameCount,
      duplicateBasenames,
    });

    if (ignoredNonImageCount > 0) {
      toast(`${ignoredNonImageCount.toLocaleString("fa-IR")} فایل غیرتصویری نادیده گرفته شد.`);
    }
    if (ignoredOversizeCount > 0) {
      toast.error(
        `${ignoredOversizeCount.toLocaleString("fa-IR")} فایل به‌خاطر بیشتر بودن از ${COVER_UPLOAD_MAX_LABEL} رد شد.`,
      );
    }
    if (duplicateBasenameCount > 0) {
      toast(
        `${duplicateBasenameCount.toLocaleString("fa-IR")} فایل تکراری با نام یکسان نادیده گرفته شد.`,
      );
    }
  }, []);

  function setSingleError(editionId: string, error: string | null) {
    setSingleErrors((current) => ({ ...current, [editionId]: error }));
  }

  function setSingleFile(editionId: string, file: File | null, error?: string | null) {
    setSingleFiles((current) => {
      const next = { ...current };
      const previous = next[editionId];
      if (previous) URL.revokeObjectURL(previous.previewUrl);

      if (!file) {
        delete next[editionId];
        setSingleError(editionId, error ?? null);
        return next;
      }

      next[editionId] = {
        file,
        previewUrl: URL.createObjectURL(file),
        error: error ?? null,
      };
      setSingleError(editionId, error ?? null);
      return next;
    });
  }

  function handleSingleCoverFile(editionId: string, file: File | null) {
    if (!file) {
      setSingleFile(editionId, null);
      return;
    }

    const validationError = validateImageFile(file, COVER_UPLOAD_MAX_BYTES);
    if (validationError) {
      setSingleFile(editionId, null, validationError);
      toast.error(validationError);
      return;
    }

    setSingleFile(editionId, file, null);
  }

  function replaceRow(item: AdminBookCoverRow | null | undefined) {
    if (!item) return;
    setRows((current) =>
      current.map((row) => (row.id === item.id ? item : row)),
    );
  }

  async function uploadSingle(edition: AdminBookCoverRow) {
    const fileState = singleFiles[edition.id];
    if (!fileState) {
      toast.error("ابتدا فایل کاور را انتخاب کنید.");
      return;
    }

    let replaceExisting = false;
    if (edition.coverStatus === "uploaded") {
      const accepted = await confirm({
        title: "جایگزینی کاور",
        description:
          "برای این نسخه قبلاً کاور آپلود شده است. می‌خواهید آن را جایگزین کنید؟",
      });
      if (!accepted) return;
      replaceExisting = true;
    }

    setUploadingIds((current) => ({ ...current, [edition.id]: true }));

    try {
      const formData = new FormData();
      formData.set("file", fileState.file);
      if (replaceExisting) formData.set("replaceExisting", "true");

      const res = await fetch(`/api/admin/book-covers/${edition.id}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = (await res.json()) as {
        item?: AdminBookCoverRow;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error || "آپلود کاور ناموفق بود.");
        return;
      }

      replaceRow(data.item);
      setSingleFile(edition.id, null);
      setSingleError(edition.id, null);
      toast.success(data.message || "کاور ثبت شد.");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setUploadingIds((current) => ({ ...current, [edition.id]: false }));
    }
  }

  const handleBulkSelection = useCallback(
    (files: FileList | File[] | null) => {
      if (!files) return;
      applyBulkSelection(Array.from(files));
    },
    [applyBulkSelection],
  );

  const handleBulkDirectoryDrop = useCallback(
    async (items: DataTransferItemList | null) => {
      if (!items || items.length === 0) return false;

      const entries = Array.from(items)
        .map((item) => (item as DragDataTransferItem).webkitGetAsEntry?.() ?? null)
        .filter(Boolean) as FileSystemEntryLike[];

      if (entries.length === 0) return false;

      const containsDirectory = entries.some((entry) => entry.isDirectory);
      if (!containsDirectory) return false;

      const fileGroups = await Promise.all(entries.map((entry) => collectFilesFromEntry(entry)));
      applyBulkSelection(fileGroups.flat());
      return true;
    },
    [applyBulkSelection],
  );

  async function uploadBulk() {
    if (bulkFiles.length === 0) {
      toast.error("ابتدا فایل‌های کاور را انتخاب کنید.");
      return;
    }

    if (replaceExistingBulk) {
      const accepted = await confirm({
        title: "جایگزینی گروهی کاورها",
        description:
          "در این حالت کاورهای موجود هم ممکن است جایگزین شوند. ادامه می‌دهید؟",
      });
      if (!accepted) return;
    }

    setBulkUploading(true);

    try {
      const formData = new FormData();
      for (const file of bulkFiles) {
        formData.append("files", file);
      }
      if (replaceExistingBulk) formData.set("replaceExisting", "true");

      const res = await fetch("/api/admin/book-covers/bulk-upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = (await res.json()) as {
        message?: string;
        error?: string;
        summary?: { uploadedCount: number; skippedCount: number };
      };

      if (!res.ok) {
        toast.error(data.error || "آپلود گروهی ناموفق بود.");
        return;
      }

                      toast.success(
        data.message ||
          `${data.summary?.uploadedCount ?? 0} کاور با موفقیت ثبت شد.`,
      );
      setBulkFiles([]);
      setBulkSelectionMeta({
        ignoredNonImageCount: 0,
        ignoredOversizeCount: 0,
        duplicateBasenameCount: 0,
        duplicateBasenames: [],
      });
      setBulkPreview(null);
      await load();
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setBulkUploading(false);
    }
  }

  const matchedCount = bulkPreview?.matches.length ?? 0;
  const ambiguousCount = bulkPreview?.ambiguousFiles.length ?? 0;
  const unmatchedCount = bulkPreview?.unmatchedFiles.length ?? 0;
  const ignoredTotal =
    bulkSelectionMeta.ignoredNonImageCount + bulkSelectionMeta.ignoredOversizeCount;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/60 p-4 shadow-[0_28px_90px_-60px_rgba(0,0,0,0.95)] backdrop-blur-md sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-4">
            <div>
              <p className="text-base font-black text-foreground">
                آپلود گروهی کاورها
              </p>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">
                چند تصویر را هم‌زمان رها کنید تا بر اساس{" "}
                <span dir="ltr" className="font-mono text-[13px]">
                  coverFilename
                </span>{" "}
                با نسخه‌ها مچ شوند. فقط مچ‌های دقیق و بدون ابهام به‌صورت خودکار
                ثبت می‌شوند.
              </p>
            </div>

            <div
              onDrop={async (event) => {
                event.preventDefault();
                event.stopPropagation();
                setBulkDragging(false);
                const hasDirectorySupport = Array.from(
                  event.dataTransfer.items ?? [],
                ).some(
                  (item) =>
                    typeof (item as DragDataTransferItem).webkitGetAsEntry ===
                    "function",
                );
                const usedDirectory = await handleBulkDirectoryDrop(
                  event.dataTransfer.items,
                );
                if (!usedDirectory) {
                  handleBulkSelection(event.dataTransfer.files);
                  if (
                    event.dataTransfer.files.length === 0 &&
                    !hasDirectorySupport &&
                    event.dataTransfer.items?.length
                  ) {
                    toast(
                      "مرورگر شما انتخاب پوشه با درگ‌ودراپ را کامل پشتیبانی نمی‌کند. از دکمه انتخاب پوشه استفاده کنید.",
                    );
                  }
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setBulkDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setBulkDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setBulkDragging(false);
              }}
              className={cn(
                "rounded-[1.8rem] border border-dashed border-border/80 bg-background/60 p-5 transition",
                bulkDragging && "border-primary/50 bg-primary/10",
              )}
            >
              <input
                id="bulk-cover-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => handleBulkSelection(event.target.files)}
              />
              <input
                ref={bulkFolderInputRef}
                id="bulk-cover-folder-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => handleBulkSelection(event.target.files)}
              />

              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">
                    فایل‌های JPG، PNG یا WEBP را اینجا رها کنید
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    یا یک پوشه کامل از کاورها را انتخاب کنید. فایل‌های غیرتصویری
                    مثل download-report.json نادیده گرفته می‌شوند.
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    می‌توانید چند فایل تصویر یا یک پوشه کامل از کاورها را انتخاب
                    کنید. حداکثر حجم هر فایل {COVER_UPLOAD_MAX_LABEL} است.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button asChild type="button" className="rounded-2xl px-5 font-bold">
                    <label htmlFor="bulk-cover-upload">انتخاب فایل‌ها</label>
                  </Button>
                  <Button asChild type="button" variant="outline" className="rounded-2xl px-5 font-bold">
                    <label htmlFor="bulk-cover-folder-upload">انتخاب پوشه</label>
                  </Button>
                  {bulkFiles.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setBulkFiles([]);
                        setBulkSelectionMeta({
                          ignoredNonImageCount: 0,
                          ignoredOversizeCount: 0,
                          duplicateBasenameCount: 0,
                          duplicateBasenames: [],
                        });
                        setBulkPreview(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      پاک کردن
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {bulkFiles.length > 0 ? (
              <div className="rounded-[1.5rem] border border-border/70 bg-background/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-foreground">
                      {bulkFiles.length.toLocaleString("fa-IR")} تصویر آماده بررسی
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ignoredTotal.toLocaleString("fa-IR")} فایل غیرتصویری/نامعتبر نادیده گرفته شد
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {bulkSelectionMeta.duplicateBasenameCount.toLocaleString("fa-IR")} فایل تکراری نادیده گرفته شد
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {matchedCount.toLocaleString("fa-IR")} مچ دقیق،{" "}
                      {ambiguousCount.toLocaleString("fa-IR")} مبهم،{" "}
                      {unmatchedCount.toLocaleString("fa-IR")} بدون مچ
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-2 text-xs font-bold text-foreground">
                      <input
                        type="checkbox"
                        checked={replaceExistingBulk}
                        onChange={(event) =>
                          setReplaceExistingBulk(event.target.checked)
                        }
                      />
                      جایگزینی کاورهای موجود
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => void fetchBulkPreview(bulkFiles)}
                      disabled={bulkPreviewLoading || bulkUploading}
                    >
                      {bulkPreviewLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      بازبینی مچ‌ها
                    </Button>

                    <Button
                      type="button"
                      className="rounded-2xl px-5 font-bold"
                      onClick={() => void uploadBulk()}
                      disabled={bulkUploading || matchedCount === 0}
                    >
                      {bulkUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                      آپلود فایل‌های معتبر
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {bulkFiles.map((file) => (
                    <span
                      key={`${file.name}-${file.size}`}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground"
                    >
                      <span dir="ltr" className="max-w-[240px] truncate font-mono">
                        {file.name}
                      </span>
                      <span>{formatFileSize(file.size)}</span>
                    </span>
                  ))}
                </div>
                {bulkSelectionMeta.duplicateBasenames.length > 0 ? (
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    نام‌های تکراری نادیده‌گرفته‌شده:{" "}
                    <span dir="ltr" className="font-mono">
                      {bulkSelectionMeta.duplicateBasenames.slice(0, 6).join(", ")}
                    </span>
                    {bulkSelectionMeta.duplicateBasenames.length > 6
                      ? " ..."
                      : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.6rem] border border-border/70 bg-background/55 p-4">
            <p className="text-sm font-black text-foreground">نتیجه‌ی مچ فایل‌ها</p>
            <div className="mt-4 space-y-3 text-sm">
              <PreviewBucket
                title="مچ دقیق"
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                items={
                  bulkPreview?.matches.map((match) => (
                    <div
                      key={`${match.filename}-${match.edition.id}`}
                      className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3"
                    >
                      <p dir="ltr" className="truncate font-mono text-xs text-foreground">
                        {match.filename}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {match.edition.bookTitle} •{" "}
                        {match.edition.publisher || match.edition.translator || "نسخه"}
                      </p>
                    </div>
                  )) ?? []
                }
                emptyText="هنوز مچ دقیقی پیدا نشده است."
              />

              <PreviewBucket
                title="مبهم"
                icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
                items={
                  bulkPreview?.ambiguousFiles.map((item) => (
                    <div
                      key={item.filename}
                      className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3"
                    >
                      <p dir="ltr" className="truncate font-mono text-xs text-foreground">
                        {item.filename}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        این نام به {item.editions.length.toLocaleString("fa-IR")} نسخه
                        می‌خورد و برای جلوگیری از اتصال اشتباه رد شد.
                      </p>
                    </div>
                  )) ?? []
                }
                emptyText="فایل مبهمی وجود ندارد."
              />

              <PreviewBucket
                title="بدون مچ"
                icon={<XCircle className="h-4 w-4 text-rose-500" />}
                items={
                  bulkPreview?.unmatchedFiles.map((filename) => (
                    <div
                      key={filename}
                      className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-3"
                    >
                      <p dir="ltr" className="truncate font-mono text-xs text-foreground">
                        {filename}
                      </p>
                    </div>
                  )) ?? []
                }
                emptyText="فایل بدون مچی وجود ندارد."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card/55 p-4 shadow-[0_28px_90px_-60px_rgba(0,0,0,0.95)] backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-base font-black text-foreground">
              صف مدیریت کاور نسخه‌ها
            </p>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">
              جست‌وجو روی عنوان، نویسنده، ناشر، مترجم، شابک و کد منبع اعمال می‌شود.
              فیلتر تازه‌واردها نسخه‌های {recentImportDays.toLocaleString("fa-IR")} روز
              اخیر را نشان می‌دهد.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-2 text-xs font-bold text-foreground">
              <input
                type="checkbox"
                checked={onlyMissing}
                onChange={(event) => setOnlyMissing(event.target.checked)}
              />
              فقط نسخه‌های بدون کاور واقعی
            </label>
            <label className="flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-2 text-xs font-bold text-foreground">
              <input
                type="checkbox"
                checked={recentOnly}
                onChange={(event) => setRecentOnly(event.target.checked)}
              />
              تازه‌واردها
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="جست‌وجوی عنوان، نویسنده، ناشر، مترجم، شابک..."
              className="h-11 rounded-2xl border-border/80 bg-background/70 pe-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl border-border/80 bg-background/60 px-5"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            نوسازی
          </Button>
        </div>

        {loading ? (
          <div className="mt-6 flex min-h-48 items-center justify-center rounded-[1.8rem] border border-border/70 bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-6 rounded-[1.8rem] border border-dashed border-border/75 bg-background/50 px-4 py-12 text-center">
            <p className="text-sm font-black text-foreground">
              نسخه‌ای برای نمایش پیدا نشد
            </p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              فیلترها را کمی بازتر کنید یا بعد از import دوباره این صفحه را بررسی
              کنید.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {rows.map((edition) => {
              const currentFile = singleFiles[edition.id];
              const meta = statusMeta(edition.coverStatus);
              return (
                <article
                  key={edition.id}
                  className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-background/50 p-4 shadow-[0_18px_60px_-46px_rgba(0,0,0,0.45)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentFile?.previewUrl || edition.coverImage || PLACEHOLDER}
                          alt={edition.bookTitle}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="line-clamp-1 text-sm font-black text-foreground">
                            {edition.bookTitle}
                          </p>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                              meta.className,
                            )}
                          >
                            {meta.label}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                          {edition.author}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                          {edition.publisher ? (
                            <BadgeLike label={`ناشر: ${edition.publisher}`} />
                          ) : null}
                          {edition.translator ? (
                            <BadgeLike label={`مترجم: ${edition.translator}`} />
                          ) : null}
                          {edition.isbn13 ? (
                            <BadgeLike label={`شابک ۱۳: ${edition.isbn13}`} />
                          ) : edition.isbn10 ? (
                            <BadgeLike label={`شابک ۱۰: ${edition.isbn10}`} />
                          ) : null}
                        </div>

                        <dl className="mt-3 space-y-1.5 text-xs leading-6 text-muted-foreground">
                          {edition.sourceEditionCode ? (
                            <div className="flex gap-2">
                              <dt className="font-bold text-foreground">
                                کد منبع:
                              </dt>
                              <dd dir="ltr" className="font-mono">
                                {edition.sourceEditionCode}
                              </dd>
                            </div>
                          ) : null}
                          <div className="flex gap-2">
                            <dt className="font-bold text-foreground">
                              نام پیشنهادی فایل:
                            </dt>
                            <dd
                              dir="ltr"
                              className="max-w-full truncate font-mono"
                              title={edition.coverFilename || "—"}
                            >
                              {edition.coverFilename || "—"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="w-full max-w-sm shrink-0 rounded-[1.5rem] border border-border/70 bg-card/65 p-3">
                      <SingleUploadBox
                        editionId={edition.id}
                        uploading={!!uploadingIds[edition.id]}
                        fileState={currentFile}
                        error={singleErrors[edition.id] ?? null}
                        onSelect={(file) => handleSingleCoverFile(edition.id, file)}
                        onUpload={() => void uploadSingle(edition)}
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          asChild
                          type="button"
                          variant="outline"
                          className="h-10 rounded-xl border-border/80 bg-background/60 px-4"
                        >
                          <Link href={`/admin/books/${edition.catalogBookId}/edit`}>
                            ویرایش کتاب
                          </Link>
                        </Button>

                        {edition.catalogSlug ? (
                          <Button
                            asChild
                            type="button"
                            variant="ghost"
                            className="h-10 rounded-xl px-4"
                          >
                            <Link
                              href={`/book/${encodeURIComponent(edition.catalogSlug)}?edition=${encodeURIComponent(edition.id)}`}
                              target="_blank"
                            >
                              مشاهده عمومی
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-between rounded-[1.4rem] border border-border/70 bg-background/55 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              صفحه {page.toLocaleString("fa-IR")} از{" "}
              {totalPages.toLocaleString("fa-IR")}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                قبلی
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                بعدی
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function PreviewBucket({
  title,
  icon,
  items,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: React.ReactNode[];
  emptyText: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-border/70 bg-card/65 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto pe-1">
        {items.length > 0 ? (
          items
        ) : (
          <p className="rounded-2xl border border-dashed border-border/70 bg-background/55 px-3 py-4 text-xs leading-6 text-muted-foreground">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function BadgeLike({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-border/70 bg-card/70 px-2.5 py-1 font-bold text-muted-foreground">
      {label}
    </span>
  );
}

function SingleUploadBox({
  editionId,
  uploading,
  fileState,
  error,
  onSelect,
  onUpload,
}: {
  editionId: string;
  uploading: boolean;
  fileState: SingleFileState | undefined;
  error: string | null;
  onSelect: (file: File | null) => void;
  onUpload: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputId = `cover-upload-${editionId}`;

  return (
    <div
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);
        onSelect(event.dataTransfer.files?.[0] ?? null);
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);
      }}
      className={cn(
        "rounded-[1.3rem] border border-dashed border-border/70 bg-background/55 p-4 transition",
        dragging && "border-primary/50 bg-primary/10",
        error && "border-destructive/60 bg-destructive/5",
      )}
    >
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
      />

      {fileState ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileState.previewUrl}
              alt="پیش‌نمایش کاور انتخاب‌شده"
              className="h-40 w-full rounded-xl object-cover"
            />
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p dir="ltr" className="truncate text-xs font-mono text-foreground">
                {fileState.file.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatFileSize(fileState.file.size)}
              </p>
            </div>
          </div>

          {error ? (
            <p className="text-xs font-medium text-destructive">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline" className="h-10 rounded-xl">
              <label htmlFor={inputId}>انتخاب تصویر</label>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onSelect(null)}
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl px-4 font-bold"
              onClick={onUpload}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              آپلود کاور
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-black text-foreground">
            Drag and drop cover image here
          </p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            یک فایل JPG، PNG یا WEBP را اینجا رها کنید یا با دکمه‌ی زیر انتخاب
            کنید. حداکثر حجم مجاز {COVER_UPLOAD_MAX_LABEL} است.
          </p>
          {error ? (
            <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
          ) : null}
          <Button asChild type="button" className="mt-3 rounded-2xl px-5 font-bold">
            <label htmlFor={inputId}>Choose image</label>
          </Button>
        </div>
      )}
    </div>
  );
}
