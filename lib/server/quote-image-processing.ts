import sharp from "sharp";

const MAX_INPUT_PIXELS = 50_000_000;
const MAX_INPUT_DIMENSION = 12_000;
const MAX_OUTPUT_LONG_EDGE = 2_000;
const WEBP_QUALITY = 85;

const FORMAT_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export class QuoteImageProcessingError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_IMAGE" | "UNSUPPORTED_IMAGE" | "IMAGE_TOO_LARGE",
  ) {
    super(message);
    this.name = "QuoteImageProcessingError";
  }
}

export interface ProcessedQuoteImage {
  buffer: Buffer;
  contentType: "image/webp";
  filename: string;
}

/**
 * Decodes and normalizes a photographed page before it reaches object storage.
 * rotate() applies EXIF orientation; omitting withMetadata() strips EXIF/ICC and
 * other metadata. fit=inside preserves the complete page without cropping.
 */
export async function processQuoteImage(input: {
  buffer: Buffer;
  declaredMime: string;
  filename: string;
}): Promise<ProcessedQuoteImage> {
  try {
    const source = sharp(input.buffer, {
      failOn: "warning",
      limitInputPixels: MAX_INPUT_PIXELS,
      pages: 1,
      sequentialRead: true,
    });
    const metadata = await source.metadata();
    const format = metadata.format ?? "";
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (!FORMAT_MIME[format]) {
      throw new QuoteImageProcessingError(
        "فرمت تصویر پشتیبانی نمی‌شود. لطفاً JPEG، PNG یا WebP انتخاب کنید.",
        "UNSUPPORTED_IMAGE",
      );
    }
    if (FORMAT_MIME[format] !== input.declaredMime) {
      throw new QuoteImageProcessingError(
        "نوع واقعی تصویر با فایل انتخاب‌شده مطابقت ندارد.",
        "INVALID_IMAGE",
      );
    }
    if (!width || !height || width > MAX_INPUT_DIMENSION || height > MAX_INPUT_DIMENSION) {
      throw new QuoteImageProcessingError(
        "ابعاد تصویر بیش از حد بزرگ یا نامعتبر است.",
        "IMAGE_TOO_LARGE",
      );
    }
    if (width * height > MAX_INPUT_PIXELS) {
      throw new QuoteImageProcessingError(
        "تعداد پیکسل‌های تصویر بیش از حد مجاز است.",
        "IMAGE_TOO_LARGE",
      );
    }

    const buffer = await source
      .rotate()
      .flatten({ background: "#ffffff" })
      .resize({
        width: MAX_OUTPUT_LONG_EDGE,
        height: MAX_OUTPUT_LONG_EDGE,
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .webp({ quality: WEBP_QUALITY, smartSubsample: true, effort: 4 })
      .toBuffer();

    const base = input.filename.replace(/\.[^.]+$/, "") || "quote-page";
    return { buffer, contentType: "image/webp", filename: `${base}.webp` };
  } catch (error) {
    if (error instanceof QuoteImageProcessingError) throw error;
    throw new QuoteImageProcessingError(
      "تصویر معتبر نیست یا به‌درستی پردازش نشد. لطفاً JPEG، PNG یا WebP دیگری انتخاب کنید.",
      "INVALID_IMAGE",
    );
  }
}

export const QUOTE_IMAGE_OUTPUT_POLICY = {
  maxInputPixels: MAX_INPUT_PIXELS,
  maxInputDimension: MAX_INPUT_DIMENSION,
  maxOutputLongEdge: MAX_OUTPUT_LONG_EDGE,
  format: "webp" as const,
  quality: WEBP_QUALITY,
};
