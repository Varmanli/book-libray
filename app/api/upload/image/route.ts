import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import {
  type ImageUploadFolder,
  IMAGE_UPLOAD_FOLDERS,
  MAX_UPLOAD_BYTES,
  UPLOAD_FAILED_MESSAGE,
  validateFaviconFile,
  validateImageFile,
} from "@/lib/upload";
import { StorageError } from "@/lib/server/s3";
import { saveImageUpload } from "@/lib/server/upload-storage";

export const runtime = "nodejs";

// پیامِ شفاف برای زمانی که سرور نمی‌تواند به فضای ذخیره‌سازی متصل شود.
const STORAGE_UNREACHABLE_MESSAGE =
  "اتصال سرور به فضای ذخیره‌سازی برقرار نشد. لطفاً چند لحظه بعد دوباره تلاش کنید.";

// سقف بزرگ‌تر برای دارایی‌های برندینگ (لوگو/فاوآیکون/تصویر اشتراک‌گذاری).
const SETTINGS_MAX_BYTES = 1024 * 1024; // ۱ مگابایت

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const data = await req.formData();
    const file = data.get("file") as File | null;
    const rawFolder = data.get("folder");
    const kind = data.get("kind"); // "favicon" برای دارایی فاوآیکون

    if (!file) {
      return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
    }

    if (
      typeof rawFolder !== "string" ||
      !IMAGE_UPLOAD_FOLDERS.includes(
        rawFolder as (typeof IMAGE_UPLOAD_FOLDERS)[number]
      )
    ) {
      return NextResponse.json({ error: "پوشه‌ی آپلود معتبر نیست." }, { status: 400 });
    }
    const folder = rawFolder as ImageUploadFolder;

    // دارایی‌های تنظیمات فقط برای ادمین (لوگو/فاوآیکون/تصویر سوشال).
    const isSettings = folder === "settings";
    if (isSettings && !isAdmin(user)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const maxBytes = isSettings ? SETTINGS_MAX_BYTES : MAX_UPLOAD_BYTES;
    const isFavicon = isSettings && kind === "favicon";

    const validationError = isFavicon
      ? validateFaviconFile({ type: file.type, size: file.size }, maxBytes)
      : validateImageFile({ type: file.type, size: file.size }, maxBytes);
    if (validationError) {
      // 413 برای حجم زیاد، 400 برای نوع نامعتبر
      const status = file.size > maxBytes ? 413 : 400;
      return NextResponse.json({ error: validationError }, { status });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await saveImageUpload({
      buffer,
      contentType: file.type,
      filename: file.name || "image",
      folder,
    });

    // فقط key/url را برمی‌گردانیم (سازگار با ImageUploader)؛ درایور صرفاً داخلی است.
    return NextResponse.json({
      key: uploadResult.key,
      url: uploadResult.url,
    });
  } catch (err) {
    console.error(err);

    // خطاهای اتصال به فضای ذخیره‌سازی → پیام شفاف و کد وضعیتِ مناسب.
    if (err instanceof StorageError) {
      if (err.code === "STORAGE_TIMEOUT" || err.code === "STORAGE_UNREACHABLE") {
        return NextResponse.json(
          { error: STORAGE_UNREACHABLE_MESSAGE, code: err.code },
          { status: 503 },
        );
      }
      if (err.code === "STORAGE_CONFIG") {
        return NextResponse.json(
          { error: STORAGE_UNREACHABLE_MESSAGE, code: err.code },
          { status: 503 },
        );
      }
      if (err.code === "STORAGE_FORBIDDEN") {
        return NextResponse.json(
          { error: "دسترسی به فضای ذخیره‌سازی مجاز نیست.", code: err.code },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ error: UPLOAD_FAILED_MESSAGE }, { status: 500 });
  }
}
