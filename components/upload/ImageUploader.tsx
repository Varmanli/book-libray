"use client";

import * as React from "react";
import {
  ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
  UserRound,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACCEPT_ATTR,
  FAVICON_ACCEPT_ATTR,
  getImageUploadPolicy,
  type ImageUploadFolder,
  UPLOAD_FAILED_MESSAGE,
  UPLOAD_SUCCESS_MESSAGE,
  validateFaviconFile,
  validateImageFile,
} from "@/lib/upload";

type UploadVariant = "cover" | "avatar" | "banner" | "square" | "wide" | "document";
type UploadKind = "image" | "favicon";

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  onKeyChange?: (key: string) => void;
  onUploadStateChange?: (uploading: boolean) => void;
  folder?: ImageUploadFolder;
  label?: string;
  description?: string;
  placeholder?: string;
  aspect?: UploadVariant;
  variant?: UploadVariant;
  maxSizeKb?: number;
  /** نوع دارایی؛ "favicon" آپلودِ PNG/ICO را فعال می‌کند. */
  kind?: UploadKind;
  disabled?: boolean;
  required?: boolean;
  /** اکشن‌ها به‌صورت یک پیل شناور روی گوشه‌ی تصویر نمایش داده شوند (مناسب بنر). */
  overlayActions?: boolean;
  className?: string;
  /** شناسه مالک مقصد؛ فقط مسیر ادمین اجازه استفاده از آن را می‌دهد. */
  targetOwnerId?: string;
}

type UploadResponse = { key: string; url: string };

function isUploadResponse(
  value: UploadResponse | { error?: string } | null
): value is UploadResponse {
  return (
    !!value &&
    "url" in value &&
    "key" in value &&
    typeof value.url === "string" &&
    typeof value.key === "string"
  );
}

function uploadImage(
  file: File,
  folder: ImageUploadFolder,
  onProgress: (value: number) => void,
  kind: UploadKind = "image",
  targetOwnerId?: string,
) {
  return new Promise<UploadResponse>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    if (kind !== "image") formData.append("kind", kind);
    if (targetOwnerId) formData.append("targetOwnerId", targetOwnerId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/image");
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onerror = () => reject(new Error(UPLOAD_FAILED_MESSAGE));
    xhr.onload = () => {
      const response = xhr.response as
        | UploadResponse
        | { error?: string }
        | null;

      if (xhr.status >= 200 && xhr.status < 300 && isUploadResponse(response)) {
        resolve(response);
        return;
      }

      reject(
        new Error(
          response && "error" in response && response.error
            ? response.error
            : UPLOAD_FAILED_MESSAGE
        )
      );
    };

    xhr.send(formData);
  });
}

/** شکل قاب پیش‌نمایش برای هر نوع تصویر — مینیمال و گوشه‌های نرم. */
function frameShape(variant: UploadVariant) {
  switch (variant) {
    case "avatar":
      return "aspect-square w-24 rounded-full sm:w-28";
    case "banner":
      return "aspect-[16/5] w-full rounded-2xl";
    case "cover":
      return "aspect-[2/3] w-32 rounded-xl sm:w-36";
    case "wide":
      return "aspect-video w-full rounded-2xl";
    case "document":
      return "min-h-48 max-h-80 w-full rounded-2xl";
    default:
      return "aspect-square w-full max-w-48 rounded-2xl";
  }
}

function emptyLabel(variant: UploadVariant) {
  switch (variant) {
    case "avatar":
      return "افزودن آواتار";
    case "banner":
      return "افزودن بنر";
    case "cover":
      return "افزودن جلد";
    default:
      return "افزودن تصویر";
  }
}

export function ImageUploader({
  value,
  onChange,
  onKeyChange,
  onUploadStateChange,
  folder = "temp",
  label,
  description,
  aspect,
  variant,
  maxSizeKb,
  kind = "image",
  disabled = false,
  required = false,
  overlayActions = false,
  className,
  targetOwnerId,
}: ImageUploaderProps) {
  const isFavicon = kind === "favicon";
  const acceptAttr = isFavicon ? FAVICON_ACCEPT_ATTR : ACCEPT_ATTR;
  const resolvedVariant = variant ?? aspect ?? "square";
  const isAvatar = resolvedVariant === "avatar";
  const useOverlay = overlayActions && !isAvatar;
  const shape = frameShape(resolvedVariant);

  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(value ?? null);
  const [loadError, setLoadError] = React.useState(false);

  const resolvedMaxSizeKb =
    maxSizeKb ?? getImageUploadPolicy(folder).maxInputBytes / 1024;
  const maxSizeBytes = resolvedMaxSizeKb * 1024;

  React.useEffect(() => {
    setPreviewUrl(value ?? null);
    setLoadError(false);
  }, [value]);

  React.useEffect(() => {
    onUploadStateChange?.(uploading);
  }, [onUploadStateChange, uploading]);

  const openPicker = React.useCallback(() => {
    if (!disabled && !uploading) {
      inputRef.current?.click();
    }
  }, [disabled, uploading]);

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setError(null);
    setProgress(0);
    setPreviewUrl(null);
    onChange("");
    onKeyChange?.("");
    resetInput();
  };

  const handleFileSelection = async (file: File | null | undefined) => {
    if (!file || disabled || uploading) return;

    const validationError = isFavicon
      ? validateFaviconFile(file, maxSizeBytes)
      : validateImageFile(file, maxSizeBytes);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      resetInput();
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const data = await uploadImage(file, folder, setProgress, kind, targetOwnerId);
      setLoadError(false);
      setPreviewUrl(data.url);
      onChange(data.url);
      onKeyChange?.(data.key);
      setProgress(100);
      toast.success(UPLOAD_SUCCESS_MESSAGE);
    } catch (uploadError) {
      const rawMessage =
        uploadError instanceof Error ? uploadError.message : UPLOAD_FAILED_MESSAGE;
      const message =
        folder === "quotes" && rawMessage === UPLOAD_FAILED_MESSAGE
          ? "بهینه‌سازی یا بارگذاری تصویر انجام نشد. لطفاً دوباره تلاش کنید."
          : rawMessage;
      setError(message);
      setProgress(0);
      toast.error(message);
    } finally {
      setUploading(false);
      resetInput();
    }
  };

  const EmptyIcon = isAvatar ? UserRound : ImageIcon;

  const frame = (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || uploading}
      aria-label={label || "آپلود تصویر"}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void handleFileSelection(event.dataTransfer.files?.[0]);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled && !uploading) setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      className={cn(
        "group relative flex shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-muted/40 shadow-sm outline-none transition",
        !disabled && !uploading && "cursor-pointer hover:border-primary/40",
        dragging && "border-primary/60 ring-2 ring-primary/20",
        disabled && "cursor-not-allowed opacity-60",
        "focus-visible:ring-2 focus-visible:ring-primary/30",
        shape
      )}
    >
      {previewUrl && !loadError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={label || "پیش‌نمایش تصویر"}
          className={cn(
            "h-full w-full",
            resolvedVariant === "document" ? "object-contain p-2" : "object-cover",
          )}
          onError={() => setLoadError(true)}
          onLoad={() => setLoadError(false)}
        />
      ) : previewUrl && loadError ? (
        <div className="flex flex-col items-center gap-1 px-2 text-center text-destructive">
          <XCircle className="h-5 w-5" />
          <span className="text-[11px] font-medium">خطای تصویر</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 px-2 text-center text-muted-foreground">
          <EmptyIcon className={isAvatar ? "h-6 w-6" : "h-7 w-7"} />
          <span className={cn("font-medium", isAvatar ? "text-[11px]" : "text-xs")}>
            {dragging ? "اینجا رها کنید" : emptyLabel(resolvedVariant)}
          </span>
        </div>
      )}

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-medium text-white transition-opacity",
          uploading
            ? "opacity-100"
            : previewUrl && !useOverlay
            ? "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
            : "opacity-0"
        )}
      >
        {uploading ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin" />
            {progress >= 100
              ? folder === "quotes"
                ? "در حال بهینه‌سازی تصویر..."
                : "در حال ذخیره تصویر..."
              : `${progress}%`}
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            تغییر
          </span>
        )}
      </div>
    </div>
  );

  const overlayPill =
    previewUrl && !uploading ? (
      <div className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-full border border-border/60 bg-background/80 p-1 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          تغییر
        </button>
        <span className="h-4 w-px bg-border/70" />
        <button
          type="button"
          onClick={removeImage}
          disabled={disabled}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف
        </button>
      </div>
    ) : null;

  const actionButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openPicker}
        disabled={disabled || uploading}
      >
        {previewUrl ? (
          <RefreshCw className="h-4 w-4" />
        ) : (
          <UploadCloud className="h-4 w-4" />
        )}
        {uploading
          ? progress >= 100
            ? folder === "quotes"
              ? "در حال بهینه‌سازی"
              : "در حال ذخیره"
            : "در حال آپلود"
          : previewUrl
            ? "تغییر"
            : "انتخاب"}
      </Button>

      {previewUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={removeImage}
          disabled={disabled || uploading}
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </Button>
      ) : null}
    </>
  );

  const errorEl = error ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <XCircle className="h-3.5 w-3.5 shrink-0" />
      {error}
    </p>
  ) : null;

  const labelEl = label ? (
    <label
      htmlFor={inputId}
      className="block text-sm font-medium text-foreground"
    >
      {label}
      {required ? <span className="mr-1 text-destructive">*</span> : null}
    </label>
  ) : null;

  const descriptionEl = description ? (
    <p className="text-xs leading-6 text-muted-foreground">{description}</p>
  ) : null;

  const fileInput = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={acceptAttr}
      disabled={disabled || uploading}
      className="sr-only"
      onChange={(event) => {
        void handleFileSelection(event.target.files?.[0]);
      }}
    />
  );

  // آواتار: بلوک مرکزی و فشرده — عنوان، دایره، ردیف اکشن.
  if (isAvatar) {
    return (
      <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
        {labelEl}
        {fileInput}
        {frame}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {actionButtons}
        </div>
        {errorEl}
        {descriptionEl}
      </div>
    );
  }

  // بنر: اکشن‌ها به‌صورت پیل شناور روی گوشه‌ی تصویر.
  if (useOverlay) {
    return (
      <div className={cn("space-y-2.5", className)}>
        {labelEl}
        {fileInput}
        <div className="relative">
          {frame}
          {overlayPill}
        </div>
        {errorEl}
        {descriptionEl}
      </div>
    );
  }

  // پیش‌فرض (جلد و سایر): تصویر با ردیف اکشن در پایین.
  return (
    <div className={cn("space-y-3", className)}>
      {labelEl}
      {fileInput}
      {frame}
      <div className="flex flex-wrap items-center gap-2">{actionButtons}</div>
      {errorEl}
      {descriptionEl}
    </div>
  );
}
