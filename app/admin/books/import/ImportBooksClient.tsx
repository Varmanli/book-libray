"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Braces,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
  Info,
  Loader2,
  Upload,
  X,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  ImportPreviewResponse,
  ImportResultResponse,
} from "@/lib/books/import/types";

const NESTED_SAMPLE_JSON = `[
  {
    "title": "برادران کارامازوف",
    "subtitle": null,
    "originalTitle": "The Brothers Karamazov",
    "authors": [
      {
        "name": "فئودور داستایفسکی",
        "originalName": "Fyodor Dostoevsky",
        "slug": "fyodor-dostoevsky",
        "description": "نویسنده برجسته روس."
      }
    ],
    "language": "fa",
    "description": "رمانی کلاسیک، فلسفی و روان‌شناسانه درباره خانواده کارامازوف، ایمان، گناه، آزادی و مسئولیت اخلاقی.",
    "genres": ["ادبیات کلاسیک", "ادبیات روسیه", "داستان فلسفی"],
    "country": "روسیه",
    "firstPublishedYear": 1880,
    "status": "approved",
    "sourceName": "iranketab",
    "sourceUrl": "https://www.iranketab.ir/book/874-the-brothers-karamazov",
    "editions": [
      {
        "titleOverride": null,
        "translators": ["صالح حسینی"],
        "publisher": "ناهید",
        "isbn10": null,
        "isbn13": "9789646205062",
        "publishedYear": 1404,
        "pageCount": 1108,
        "coverFilename": "the-brothers-karamazov-nahid-saleh-hosseini.jpg",
        "coverUrl": null,
        "editionDescription": null,
        "status": "approved",
        "sourceName": "iranketab",
        "sourceUrl": "https://www.iranketab.ir/book/874-the-brothers-karamazov",
        "sourceEditionCode": "874"
      },
      {
        "titleOverride": null,
        "translators": ["پرویز شهدی"],
        "publisher": "نشر به‌سخن",
        "isbn10": null,
        "isbn13": "9789644531040",
        "publishedYear": 1404,
        "pageCount": 1096,
        "coverFilename": "the-brothers-karamazov-be-sokhan-parviz-shahidi.jpg",
        "coverUrl": null,
        "editionDescription": null,
        "status": "approved",
        "sourceName": "iranketab",
        "sourceUrl": "https://www.iranketab.ir/book/874-the-brothers-karamazov",
        "sourceEditionCode": "12280"
      }
    ]
  }
]`;

const FLAT_SAMPLE_JSON = `[
  {
    "title": "بوف کور",
    "originalTitle": null,
    "authors": ["صادق هدایت"],
    "translators": [],
    "publisher": "انتشارات امیرکبیر",
    "language": "fa",
    "description": "یکی از شناخته‌شده‌ترین آثار داستانی ادبیات معاصر ایران.",
    "genres": ["داستان ایرانی", "ادبیات معاصر"],
    "country": "ایران",
    "firstPublishedYear": 1937,
    "isbn10": null,
    "isbn13": null,
    "publishedYear": null,
    "pageCount": null,
    "coverFilename": "boof-koor.jpg",
    "coverUrl": null,
    "status": "approved",
    "sourceName": "manual_seed",
    "sourceUrl": null
  }
]`;

const EXCEL_COLUMNS = [
  "title",
  "subtitle",
  "originalTitle",
  "authors",
  "language",
  "description",
  "genres",
  "country",
  "firstPublishedYear",
  "bookStatus",
  "sourceName",
  "sourceUrl",
  "titleOverride",
  "translators",
  "publisher",
  "isbn10",
  "isbn13",
  "publishedYear",
  "pageCount",
  "coverFilename",
  "coverUrl",
  "editionDescription",
  "editionStatus",
  "sourceEditionCode",
];

const EXCEL_PERSIAN_COLUMNS = [
  "عنوان",
  "زیرعنوان",
  "عنوان اصلی",
  "نویسندگان",
  "زبان",
  "توضیحات",
  "ژانرها",
  "کشور",
  "سال انتشار اولیه",
  "وضعیت کتاب",
  "نام منبع",
  "لینک منبع",
  "عنوان نسخه",
  "مترجمان",
  "ناشر",
  "شابک ۱۰",
  "شابک ۱۳",
  "سال چاپ",
  "تعداد صفحات",
  "نام فایل کاور",
  "لینک کاور",
  "توضیحات نسخه",
  "وضعیت نسخه",
  "کد نسخه در منبع",
];

type ImportInputMode = "file" | "json";

const DROPZONE_ACCEPT =
  ".json,.xlsx,.xls,application/json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export default function ImportBooksClient() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ImportInputMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportResultResponse | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validCount = useMemo(
    () => preview?.validCount ?? preview?.summary.validBooks ?? 0,
    [preview],
  );

  const invalidCount = useMemo(
    () => preview?.invalidCount ?? preview?.summary.invalidBooks ?? 0,
    [preview],
  );

  const canImport = Boolean(preview) && validCount > 0 && !previewing && !importing;

  const jsonLineCount = useMemo(() => {
    if (!jsonText) return 0;
    return jsonText.split(/\r?\n/).length;
  }, [jsonText]);

  const activeFile = mode === "file" ? file : null;

  if (!mounted) {
    return (
      <div className="rounded-[1.9rem] border border-border/70 bg-card p-6 text-sm text-muted-foreground">
        در حال آماده‌سازی صفحه‌ی ایمپورت...
      </div>
    );
  }

  function resetOutputs() {
    setPreview(null);
    setResult(null);
  }

  function setSelectedFile(nextFile: File | null) {
    setFile(nextFile);
    resetOutputs();
  }

  function clearSelectedFile() {
    setSelectedFile(null);
  }

  function activateMode(nextMode: ImportInputMode) {
    setMode(nextMode);
    resetOutputs();
  }

  function normalizeManualJson(rawText: string) {
    const text = rawText.trim();
    if (!text) {
      throw new Error("ابتدا JSON را وارد کنید");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("ساختار JSON نامعتبر است. قبل از ایمپورت، سینتکس JSON را اصلاح کنید.");
    }

    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed, null, 2);
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const supportedArray =
        Array.isArray(record.books)
          ? record.books
          : Array.isArray(record.items)
            ? record.items
            : Array.isArray(record.data)
              ? record.data
              : null;

      if (supportedArray) {
        return JSON.stringify(supportedArray, null, 2);
      }
    }

    throw new Error(
      "ریشه‌ی JSON باید آرایه‌ای از کتاب‌ها باشد یا یک آبجکت با کلید books، items یا data داشته باشد.",
    );
  }

  function buildManualJsonFile() {
    const normalizedJson = normalizeManualJson(jsonText);
    const blob = new Blob([normalizedJson], { type: "application/json" });
    return new File([blob], "manual-import.json", {
      type: "application/json",
    });
  }

  function getSubmissionFile() {
    if (mode === "file") {
      if (!file) {
        throw new Error("ابتدا فایل را انتخاب کنید");
      }
      return file;
    }

    return buildManualJsonFile();
  }

  async function submit(
    endpoint: "/api/admin/books/import/preview" | "/api/admin/books/import",
  ) {
    const formData = new FormData();
    try {
      formData.set("file", getSubmissionFile());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ورودی نامعتبر است");
      return null;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      if (endpoint === "/api/admin/books/import" && data.details) {
        setResult(data.details as ImportResultResponse);
      }
      toast.error(data.error || "عملیات ناموفق بود");
      return null;
    }

    return data;
  }

  async function handlePreview() {
    setPreviewing(true);
    setResult(null);

    try {
      const data = await submit("/api/admin/books/import/preview");
      if (!data) return;

      setPreview(data);
      if (process.env.NODE_ENV !== "production") {
        console.log("import preview result", data);
      }
      toast.success("بررسی و پیش‌نمایش انجام شد");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleImport() {
    if (!preview || validCount <= 0) {
      toast.error("کتاب معتبری برای ورود وجود ندارد.");
      return;
    }

    setImporting(true);

    try {
      const data = await submit("/api/admin/books/import");
      if (!data) return;

      setResult(data);
      toast.success(
        data.message ||
          `${(data.importedCount ?? validCount).toLocaleString("fa-IR")} کتاب و ${(data.createdEditions ?? 0).toLocaleString("fa-IR")} نسخه با موفقیت وارد شد.`,
      );
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setImporting(false);
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("کپی انجام نشد");
    }
  }

  function downloadSampleJson() {
    const blob = new Blob([NESTED_SAMPLE_JSON], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ghafaseh-books-import-sample.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function fillSampleJson() {
    setJsonText(NESTED_SAMPLE_JSON);
    resetOutputs();
    toast.success("نمونه JSON داخل ویرایشگر قرار گرفت");
  }

  function clearJsonText() {
    setJsonText("");
    resetOutputs();
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden rounded-[2rem] border-border/70 bg-card/80 shadow-[0_24px_90px_-70px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/25 to-transparent" />

        <CardHeader className="relative">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                <FileUp className="h-3.5 w-3.5" />
                ورود گروهی
              </div>

              <CardTitle className="text-xl font-black">
                ورود گروهی کتاب‌ها
              </CardTitle>

              <CardDescription className="mt-2 max-w-2xl leading-7">
                فایل JSON یا Excel را بارگذاری کنید، اول پیش‌نمایش و خطاها را
                بررسی کنید و بعد کتاب‌ها و نسخه‌های معتبر را وارد دیتابیس کنید.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={downloadSampleJson}
              className="h-11 rounded-2xl border-border/80 bg-background/60 font-bold"
            >
              <Download className="h-4 w-4" />
              دانلود نمونه JSON
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <div className="space-y-4 rounded-[1.7rem] border border-border/70 bg-background/45 p-4">
            <div className="grid w-full max-w-md grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => activateMode("file")}
                className={cn(
                  "rounded-2xl border px-4 py-2.5 text-sm font-black transition-colors",
                  mode === "file"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border/70 bg-card/70 text-muted-foreground hover:border-primary/15 hover:text-foreground",
                )}
              >
                آپلود فایل
              </button>

              <button
                type="button"
                onClick={() => activateMode("json")}
                className={cn(
                  "rounded-2xl border px-4 py-2.5 text-sm font-black transition-colors",
                  mode === "json"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border/70 bg-card/70 text-muted-foreground hover:border-primary/15 hover:text-foreground",
                )}
              >
                ورود JSON دستی
              </button>
            </div>

            {mode === "file" ? (
              <div className="space-y-4">
                <input
                  id="books-import-file"
                  type="file"
                  accept={DROPZONE_ACCEPT}
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                  className="sr-only"
                />

                <label
                  htmlFor="books-import-file"
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    if (event.currentTarget.contains(event.relatedTarget as Node)) {
                      return;
                    }
                    setDragActive(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                    const droppedFile = event.dataTransfer.files?.[0] ?? null;
                    setSelectedFile(droppedFile);
                  }}
                  className={cn(
                    "block cursor-pointer rounded-[1.7rem] border-2 border-dashed p-5 transition-colors",
                    dragActive
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
                          فایل JSON یا Excel را اینجا رها کن
                        </p>
                        <p className="mt-1 text-xs leading-6 text-muted-foreground">
                          یا برای انتخاب فایل کلیک کن. فرمت‌های مجاز: JSON، XLSX، XLS
                        </p>
                      </div>
                    </div>

                    <div className="rounded-full border border-border/70 bg-background/55 px-3 py-1 text-xs font-bold text-muted-foreground">
                      Drag & Drop
                    </div>
                  </div>
                </label>

                {file ? (
                  <div className="rounded-[1.35rem] border border-border/70 bg-card/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>

                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                          {" • "}
                          {file.type || "نوع فایل نامشخص"}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearSelectedFile}
                        className="h-10 rounded-2xl border-border/80 bg-background/55"
                      >
                        <X className="h-4 w-4" />
                        حذف فایل
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    هنوز فایلی انتخاب نشده است.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4 rounded-[1.55rem] border border-border/70 bg-card/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-foreground">
                      JSON را مستقیم وارد کن
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      محتوای JSON را اینجا paste کن. در زمان ارسال، همان محتوا به فایل JSON تبدیل می‌شود.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        copyText(jsonText || NESTED_SAMPLE_JSON, "JSON کپی شد")
                      }
                      className="h-10 rounded-2xl border-border/80 bg-background/55"
                    >
                      <Copy className="h-4 w-4" />
                      کپی JSON
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={fillSampleJson}
                      className="h-10 rounded-2xl border-border/80 bg-background/55"
                    >
                      <Braces className="h-4 w-4" />
                      قالب نمونه را قرار بده
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearJsonText}
                      disabled={!jsonText}
                      className="h-10 rounded-2xl border-border/80 bg-background/55"
                    >
                      <X className="h-4 w-4" />
                      پاک کردن
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={jsonText}
                  onChange={(event) => {
                    setJsonText(event.target.value);
                    resetOutputs();
                  }}
                  dir="ltr"
                  placeholder='[\n  {\n    "title": "...",\n    "authors": ["..."]\n  }\n]'
                  className="min-h-[320px] rounded-[1.45rem] border-border bg-background/70 font-mono text-xs leading-6 text-foreground placeholder:text-muted-foreground"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{jsonText.length.toLocaleString("fa-IR")} کاراکتر</span>
                  <span>{jsonLineCount.toLocaleString("fa-IR")} خط</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              onClick={handlePreview}
              disabled={(mode === "file" ? !activeFile : !jsonText.trim()) || previewing}
              className="h-11 rounded-2xl px-5 font-bold shadow-lg shadow-primary/10"
            >
              {previewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {previewing ? "در حال بررسی..." : "بررسی و پیش‌نمایش"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleImport}
              disabled={!canImport}
              className="h-11 rounded-2xl border-border/80 bg-background/60 px-5 font-bold"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {importing
                ? "در حال ورود..."
                : validCount > 0
                  ? `ورود ${validCount.toLocaleString("fa-IR")} کتاب معتبر`
                  : "کتاب معتبری برای ورود وجود ندارد"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.9rem] border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle className="text-base font-black">
            راهنما، نمونه‌ها و فرمت فایل
          </CardTitle>

          <CardDescription>
            این بخش‌ها همیشه لازم نیستند؛ هرکدام را فقط وقتی نیاز داشتی باز کن.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <CollapsiblePanel
            title="راهنمای سریع فرمت فایل"
            description="توضیح کوتاه ساختار JSON و Excel"
            icon={<Info className="h-4 w-4" />}
          >
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>JSON باید آرایه‌ای از کتاب‌ها باشد.</p>
              <p>
                هر کتاب می‌تواند چند نسخه یا ترجمه در `editions` داشته باشد.
              </p>
              <p>
                اطلاعات عمومی کتاب مثل عنوان، نویسنده، توضیحات و ژانر روی خود
                کتاب ذخیره می‌شود.
              </p>
              <p>
                اطلاعاتی مثل مترجم، ناشر، شابک، تعداد صفحات، سال چاپ و کاور روی
                نسخه ذخیره می‌شود.
              </p>
              <p>
                برای Excel، هر ردیف نماینده یک نسخه است و اطلاعات کتاب برای
                نسخه‌های مختلف تکرار می‌شود.
              </p>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel
            title="نمونه‌های JSON"
            description="نمونه ساختار editions و نمونه ساده تخت"
            icon={<FileText className="h-4 w-4" />}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <JsonExampleCard
                title="نمونه JSON با editions"
                description="برای کتابی که چند ترجمه یا چاپ دارد."
                value={NESTED_SAMPLE_JSON}
                copyLabel="کپی نمونه JSON"
                onCopy={() => copyText(NESTED_SAMPLE_JSON, "نمونه JSON کپی شد")}
              />

              <JsonExampleCard
                title="نمونه JSON تخت"
                description="برای یک کتاب با یک نسخه."
                value={FLAT_SAMPLE_JSON}
                copyLabel="کپی نمونه ساده"
                onCopy={() => copyText(FLAT_SAMPLE_JSON, "نمونه ساده کپی شد")}
              />
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel
            title="ستون‌های Excel"
            description="ستون‌های انگلیسی و معادل‌های فارسی قابل قبول"
            icon={<FileSpreadsheet className="h-4 w-4" />}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/45 p-4">
                <p className="mb-3 text-sm font-black text-foreground">
                  ستون‌های انگلیسی
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXCEL_COLUMNS.map((column) => (
                    <Chip key={column} label={column} />
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-background/45 p-4">
                <p className="mb-3 text-sm font-black text-foreground">
                  معادل‌های فارسی ستون‌ها
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXCEL_PERSIAN_COLUMNS.map((column) => (
                    <Chip key={column} label={column} />
                  ))}
                </div>
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel
            title="نکات مهم ایمپورت"
            description="رفتار کاور، شابک تکراری، آیتم‌های مرجع و نسخه‌ها"
            icon={<AlertCircle className="h-4 w-4" />}
          >
            <div className="space-y-2 text-sm leading-7 text-muted-foreground">
              <p>کاور اجباری نیست.</p>
              <p>
                `coverUrl` لینک مستقیم تصویر جلد برای نمایش است و اگر معتبر
                باشد، همان در سایت نمایش داده می‌شود.
              </p>
              <p>
                `coverFilename` فقط نام پیشنهادی فایل برای زمانی است که بعداً
                کاور را دستی آپلود می‌کنید و به‌تنهایی به‌عنوان آدرس تصویر
                استفاده نمی‌شود.
              </p>
              <p>شابک تکراری باعث رد شدن آن نسخه می‌شود.</p>
              <p>
                اگر کتاب قبلاً وجود داشته باشد، نسخه جدید زیر همان کتاب اضافه
                می‌شود.
              </p>
              <p>
                اطلاعات مترجم، ناشر، نویسنده، ژانر و کشور در فهرست مرجع ساخته یا
                بازاستفاده می‌شوند.
              </p>
              <p>
                اگر آیتمی با همان نام و نوع وجود داشته باشد، سیستم همان را
                بازاستفاده می‌کند و مورد جدید نمی‌سازد.
              </p>
              <p>
                بهتر است برای کتاب‌های ترجمه‌ای از فرمت `editions` استفاده کنید.
              </p>
            </div>
          </CollapsiblePanel>
        </CardContent>
      </Card>

      {preview ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="کتاب‌ها"
              value={preview.summary.totalBooks}
              tone="default"
            />
            <SummaryCard
              label="نسخه‌ها"
              value={preview.summary.totalEditions}
              tone="default"
            />
            <SummaryCard
              label="آماده واردسازی"
              value={validCount}
              tone="success"
            />
            <SummaryCard
              label="موارد دارای اشکال"
              value={invalidCount}
              tone={invalidCount > 0 ? "danger" : "warning"}
            />
          </div>

          <Card className="rounded-[1.9rem] border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-black">
                پیش‌نمایش فایل
              </CardTitle>

              <CardDescription>
                {validCount > 0
                  ? `${validCount.toLocaleString("fa-IR")} کتاب آماده ورود هستند.`
                  : "کتاب معتبری برای ورود وجود ندارد."}
                {invalidCount > 0
                  ? ` ${invalidCount.toLocaleString("fa-IR")} مورد نیاز به اصلاح دارند.`
                  : ""}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {preview.books.map((book, index) => (
                <div
                  key={`${book.title}-${index}`}
                  className="rounded-[1.6rem] border border-border/70 bg-background/55 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-foreground">
                          {book.title || "بدون عنوان"}
                        </p>

                        <StateBadge
                          tone={
                            book.errors.length > 0
                              ? "danger"
                              : book.duplicateState === "existing_book"
                                ? "success"
                                : book.duplicateState ===
                                    "possible_existing_book"
                                  ? "warning"
                                  : "default"
                          }
                          label={
                            book.errors.length > 0
                              ? "خطادار"
                              : book.duplicateState === "existing_book"
                                ? "اثر موجود"
                                : book.duplicateState ===
                                    "possible_existing_book"
                                  ? "شباهت به اثر موجود"
                                  : "اثر جدید"
                          }
                        />
                      </div>

                      <p className="text-xs leading-6 text-muted-foreground">
                        {book.authors.map((author) => author.name).join("، ") ||
                          "نویسنده نامشخص"}
                        {book.originalTitle ? ` • ${book.originalTitle}` : ""}
                        {book.rowNumbers.length > 0
                          ? ` • ردیف‌ها: ${book.rowNumbers.join("، ")}`
                          : ""}
                      </p>

                      <ReferenceSummaryBadges summary={book.referenceSummary} />

                      {book.errors.map((message, itemIndex) => (
                        <Notice
                          key={itemIndex}
                          tone="danger"
                          label="نیاز به اصلاح"
                          message={message}
                        />
                      ))}

                      {book.warnings.map((message, itemIndex) => (
                        <Notice
                          key={itemIndex}
                          tone="warning"
                          message={message}
                        />
                      ))}
                    </div>

                    <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-black text-muted-foreground">
                      {book.editions.length.toLocaleString("fa-IR")} نسخه
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {book.editions.map((edition, editionIndex) => (
                      <div
                        key={`${edition.rowNumber}-${editionIndex}`}
                        className="rounded-2xl border border-border/60 bg-card/55 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-foreground">
                            {edition.titleOverride ||
                              edition.publisher?.name ||
                              "نسخه"}
                          </p>

                          <StateBadge
                            tone={
                              edition.errors.length > 0
                                ? "danger"
                                : edition.duplicateState === "existing_edition"
                                  ? "warning"
                                  : "success"
                            }
                            label={
                              edition.errors.length > 0
                                ? "ردیف نامعتبر"
                                : edition.duplicateState === "existing_edition"
                                  ? "تکراری در کاتالوگ"
                                  : "قابل ثبت"
                            }
                          />
                        </div>

                        <p className="mt-1 text-xs leading-6 text-muted-foreground">
                          {[
                            `ردیف ${edition.rowNumber}`,
                            edition.publisher
                              ? `ناشر: ${edition.publisher.name}`
                              : null,
                            edition.translators.length > 0
                              ? `مترجم: ${edition.translators
                                  .map((translator) => translator.name)
                                  .join("، ")}`
                              : null,
                            edition.isbn13 ? `شابک۱۳: ${edition.isbn13}` : null,
                            edition.isbn10 ? `شابک۱۰: ${edition.isbn10}` : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>

                        <ReferenceSummaryBadges
                          summary={edition.referenceSummary}
                        />

                        <div className="mt-2 space-y-1">
                          {edition.errors.map((message, itemIndex) => (
                            <Notice
                              key={itemIndex}
                              tone="danger"
                              label="نیاز به اصلاح"
                              message={message}
                            />
                          ))}

                          {edition.warnings.map((message, itemIndex) => (
                            <Notice
                              key={itemIndex}
                              tone="warning"
                              message={message}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}

      {result ? (
        <Card className="rounded-[1.9rem] border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base font-black">
              گزارش واردسازی
            </CardTitle>

            <CardDescription>خروجی آخرین اجرای واردسازی</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="کتاب دریافت‌شده"
                value={result.receivedBooks}
                tone="default"
              />
              <SummaryCard
                label="نسخه دریافت‌شده"
                value={result.receivedEditions}
                tone="default"
              />
              <SummaryCard
                label="کتاب معتبر"
                value={result.validBooks}
                tone="success"
              />
              <SummaryCard
                label="نسخه معتبر"
                value={result.validEditions}
                tone="success"
              />
              <SummaryCard
                label="کتاب جدید"
                value={result.createdBooks}
                tone="success"
              />
              <SummaryCard
                label="کتاب بازاستفاده‌شده"
                value={result.reusedBooks}
                tone="default"
              />
              <SummaryCard
                label="نسخه ساخته‌شده"
                value={result.createdEditions}
                tone="success"
              />
              <SummaryCard
                label="نسخه ردشده"
                value={result.skippedEditions}
                tone="warning"
              />
              <SummaryCard
                label="کتاب ردشده"
                value={result.skippedBooks}
                tone={result.skippedBooks > 0 ? "warning" : "default"}
              />
              <SummaryCard
                label="نسخه ناموفق"
                value={result.failedEditions}
                tone={result.failedEditions > 0 ? "danger" : "default"}
              />
              <SummaryCard
                label="مرجع جدید"
                value={result.referenceItems.created}
                tone="success"
              />
              <SummaryCard
                label="مرجع بازاستفاده‌شده"
                value={result.referenceItems.reused}
                tone="default"
              />
            </div>

            {result.referenceItems.updated > 0 ? (
              <Notice
                tone="warning"
                message={`آیتم مرجع تکمیل‌شده: ${result.referenceItems.updated.toLocaleString("fa-IR")}`}
              />
            ) : null}

            {result.skippedDuplicateEditions > 0 ? (
              <Notice
                tone="warning"
                message={`نسخه‌های تکراری ردشده: ${result.skippedDuplicateEditions.toLocaleString("fa-IR")}`}
              />
            ) : null}

            {result.errors.length > 0 ? (
              <div className="space-y-1 pt-2">
                {result.errors.map((message, index) => (
                  <Notice key={index} tone="danger" message={message} />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function CollapsiblePanel({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/45">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background/70">
        <span className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
            {icon}
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-black text-foreground">
              {title}
            </span>

            {description ? (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {description}
              </span>
            ) : null}
          </span>
        </span>

        <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:-rotate-90 group-open:text-primary" />
      </summary>

      <div className="border-t border-border/70 px-4 py-4">{children}</div>
    </details>
  );
}

function JsonExampleCard({
  title,
  description,
  value,
  copyLabel,
  onCopy,
}: {
  title: string;
  description: string;
  value: string;
  copyLabel: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/45 p-4">
      <div className="mb-3">
        <p className="text-sm font-black text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <Textarea
        readOnly
        value={value}
        dir="ltr"
        className="min-h-[320px] rounded-2xl border-border bg-card/70 font-mono text-xs leading-6"
      />

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCopy}
          className="rounded-2xl border-border/80 bg-card/70"
        >
          <Copy className="h-4 w-4" />
          {copyLabel}
        </Button>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
      {label}
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

function ReferenceSummaryBadges({
  summary,
}: {
  summary: { created: number; reused: number; updated: number };
}) {
  const items = [
    summary.reused > 0
      ? `موجود ${summary.reused.toLocaleString("fa-IR")}`
      : null,
    summary.created > 0
      ? `جدید ${summary.created.toLocaleString("fa-IR")}`
      : null,
    summary.updated > 0
      ? `تکمیل اطلاعات ${summary.updated.toLocaleString("fa-IR")}`
      : null,
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {items.map((label) => (
        <span
          key={label}
          className="rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[11px] font-bold text-muted-foreground"
        >
          {label}
        </span>
      ))}
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
          : "border-border/70 bg-card/70 text-muted-foreground";

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
  label,
  message,
  tone,
}: {
  label?: string;
  message: string;
  tone: "warning" | "danger";
}) {
  const Icon = tone === "danger" ? AlertCircle : CheckCircle2;
  const className =
    tone === "danger"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
      : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-6",
        className,
      )}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span className="space-y-1">
        {label ? (
          <span className="block text-[10px] font-black uppercase tracking-wide opacity-80">
            {label}
          </span>
        ) : null}
        <span>{message}</span>
      </span>
    </div>
  );
}
