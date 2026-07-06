import { setDefaultResultOrder } from "node:dns";
import { Agent as HttpsAgent } from "node:https";
import { Agent as HttpAgent } from "node:http";

import {
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

import type { ImageUploadFolder } from "@/lib/upload";
import { buildUploadKey } from "@/lib/server/upload-key";

// IPv4 را اول امتحان کن. در برخی شبکه‌ها Node یک آدرس IPv6ِ غیرقابل‌مسیریابی را
// اول انتخاب می‌کند و اتصال تا تایم‌اوت معلق می‌ماند. آروان فعلاً فقط A دارد،
// پس این تغییر بی‌ضرر است و از محیط‌های دیگر هم محافظت می‌کند.
try {
  setDefaultResultOrder("ipv4first");
} catch {
  // در نسخه‌های قدیمی‌تر Node موجود نیست؛ نادیده بگیر.
}

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

// زمان‌بندی‌ها سخاوتمندانه‌اند چون تأخیرِ اتصال/TLS به آروان از برخی شبکه‌ها
// نوسان زیادی دارد (از ~۲ تا ~۲۰ ثانیه دیده شده). مقادیر خیلی کوچک باعث
// شکستِ کاذب می‌شوند؛ این مقادیر اتصال‌های واقعاً معلق را هم در نهایت می‌بندند.
const CONNECTION_TIMEOUT_MS = 10_000; // مهلت برقراری اتصال TCP
const REQUEST_TIMEOUT_MS = 30_000; // مهلت کل درخواست (شامل TLS + آپلود)
const MAX_ATTEMPTS = 3; // یعنی ۲ تلاش مجدد پس از خطای اول

/** خطای لایه‌ی ذخیره‌سازی با کدِ قابل‌تشخیص برای نگاشت به پیام کاربرپسند. */
export class StorageError extends Error {
  constructor(
    message: string,
    readonly code:
      | "STORAGE_TIMEOUT"
      | "STORAGE_UNREACHABLE"
      | "STORAGE_CONFIG"
      | "STORAGE_FORBIDDEN"
      | "STORAGE_UNKNOWN",
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

function assertS3Config() {
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new StorageError(
      "S3 configuration is incomplete.",
      "STORAGE_CONFIG",
    );
  }
}

// کلاینت تک‌نمونه‌ای (singleton) با keep-alive؛ ساختِ کلاینت در هر درخواست،
// اتصال‌ها را دوباره برقرار می‌کند و در dev می‌تواند به استال/تایم‌اوت منجر شود.
let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  assertS3Config();
  if (cachedClient) return cachedClient;

  // keepAlive عمداً خاموش است. آروان (یا یک واسط) سوکت‌های idleِ keep-alive را
  // بی‌صدا می‌بندد؛ استفاده‌ی دوباره از آن سوکتِ مرده در یک پراسسِ بلندعمر (سرور
  // dev/پرود) به استال و تایم‌اوت می‌انجامد — دقیقاً همان چیزی که در آپلودهای
  // واقعی دیده شد، در حالی که اسکریپت‌های کوتاه‌عمر (سوکت تازه) همیشه موفق‌اند.
  // آپلودها کم‌تکرارند، پس هزینه‌ی یک TLS handshake به‌ازای هر آپلود قابل‌قبول است.
  const agentOptions = { keepAlive: false, maxSockets: 50 } as const;

  cachedClient = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    maxAttempts: MAX_ATTEMPTS,
    credentials: {
      accessKeyId: accessKeyId as string,
      secretAccessKey: secretAccessKey as string,
    },
    requestHandler: new NodeHttpHandler({
      connectionTimeout: CONNECTION_TIMEOUT_MS,
      requestTimeout: REQUEST_TIMEOUT_MS,
      httpAgent: new HttpAgent(agentOptions),
      httpsAgent: new HttpsAgent(agentOptions),
    }),
  });

  return cachedClient;
}

function getPublicUrl(key: string) {
  if (process.env.S3_PUBLIC_BASE_URL) {
    return `${process.env.S3_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${key}`;
  }

  return `${endpoint?.replace(/\/+$/, "")}/${bucket}/${key}`;
}

/** فقط هاستِ اندپوینت برای لاگ (بدون افشای کل URL/اعتبارنامه). */
function endpointHost(): string {
  try {
    return endpoint ? new URL(endpoint).host : "(unset)";
  } catch {
    return "(invalid)";
  }
}

/** تشخیص خطاهای تایم‌اوت/اتصال از روی کد و نام خطا. */
function isTimeoutError(err: unknown): boolean {
  const e = err as { code?: string; name?: string } | null;
  if (!e) return false;
  return (
    e.code === "ETIMEDOUT" ||
    e.code === "ESOCKETTIMEDOUT" ||
    e.name === "TimeoutError" ||
    e.name === "RequestTimeout"
  );
}

function isConnectionError(err: unknown): boolean {
  const e = err as { code?: string } | null;
  return (
    !!e &&
    (e.code === "ECONNREFUSED" ||
      e.code === "ENOTFOUND" ||
      e.code === "EHOSTUNREACH" ||
      e.code === "ENETUNREACH" ||
      e.code === "ECONNRESET")
  );
}

/** خطای خام SDK را به StorageError با کدِ معنادار تبدیل می‌کند. */
function toStorageError(err: unknown, step: string): StorageError {
  const e = err as
    | { code?: string; name?: string; message?: string; $metadata?: { httpStatusCode?: number } }
    | null;
  const status = e?.$metadata?.httpStatusCode;

  if (isTimeoutError(err)) {
    return new StorageError(`Storage timeout during ${step}.`, "STORAGE_TIMEOUT", err);
  }
  if (isConnectionError(err)) {
    return new StorageError(`Storage unreachable during ${step}.`, "STORAGE_UNREACHABLE", err);
  }
  if (status === 403 || e?.name === "AccessDenied") {
    return new StorageError(`Storage access denied during ${step}.`, "STORAGE_FORBIDDEN", err);
  }
  return new StorageError(
    `Storage error during ${step}: ${e?.name || e?.code || "unknown"}.`,
    "STORAGE_UNKNOWN",
    err,
  );
}

export async function uploadImageToS3(params: {
  buffer: Buffer;
  contentType: string;
  filename: string;
  folder: ImageUploadFolder;
  objectKey?: string;
}) {
  const client = getClient();
  const key =
    params.objectKey && params.objectKey.trim()
      ? params.objectKey.trim().replace(/^\/+/, "")
      : buildUploadKey(params.folder, params.filename);

  // لاگِ بدون افشای راز: نوع/پوشه، حجم، mime، هاستِ اندپوینت، باکت، forcePathStyle.
  const started = Date.now();
  console.info("[s3] upload start", {
    folder: params.folder,
    sizeBytes: params.buffer.length,
    contentType: params.contentType,
    endpointHost: endpointHost(),
    bucket,
    forcePathStyle: true,
  });

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.contentType,
        CacheControl: "public, max-age=31536000, immutable",
        // بدون این ACL، آبجکت‌ها روی آروان به‌صورت خصوصی ذخیره می‌شوند و
        // URL عمومی با خطای 403 برمی‌گردد؛ در نتیجه تصویر در UI رندر نمی‌شود.
        ACL: "public-read",
      }),
    );
  } catch (err) {
    const storageErr = toStorageError(err, "PutObject");
    console.error("[s3] upload FAILED", {
      step: "PutObject",
      code: storageErr.code,
      durationMs: Date.now() - started,
      endpointHost: endpointHost(),
      bucket,
    });
    throw storageErr;
  }

  console.info("[s3] upload OK", {
    folder: params.folder,
    durationMs: Date.now() - started,
  });

  return { key, url: getPublicUrl(key) };
}

/**
 * بررسی سلامتِ اتصال به فضای ذخیره‌سازی: دسترسی به باکت + یک PutObject کوچک.
 * برای تشخیص سریعِ مشکلِ پیکربندی/شبکه بدون آپلود واقعیِ کاربر.
 */
export async function checkStorageConnectivity(): Promise<{
  ok: boolean;
  endpointHost: string;
  bucket: string | undefined;
  forcePathStyle: boolean;
  steps: { step: string; ok: boolean; durationMs: number; code?: string }[];
  publicUrl?: string;
}> {
  const steps: { step: string; ok: boolean; durationMs: number; code?: string }[] = [];
  const base = {
    endpointHost: endpointHost(),
    bucket,
    forcePathStyle: true,
  };

  let client: S3Client;
  try {
    client = getClient();
  } catch (err) {
    const se = toStorageError(err, "config");
    return { ...base, ok: false, steps: [{ step: "config", ok: false, durationMs: 0, code: se.code }] };
  }

  // HeadBucket
  let t = Date.now();
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    steps.push({ step: "HeadBucket", ok: true, durationMs: Date.now() - t });
  } catch (err) {
    const se = toStorageError(err, "HeadBucket");
    steps.push({ step: "HeadBucket", ok: false, durationMs: Date.now() - t, code: se.code });
    return { ...base, ok: false, steps };
  }

  // PutObject کوچک
  t = Date.now();
  const key = `settings/__healthcheck-${Date.now()}.txt`;
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from("ok"),
        ContentType: "text/plain",
        CacheControl: "no-store",
        ACL: "public-read",
      }),
    );
    steps.push({ step: "PutObject", ok: true, durationMs: Date.now() - t });
  } catch (err) {
    const se = toStorageError(err, "PutObject");
    steps.push({ step: "PutObject", ok: false, durationMs: Date.now() - t, code: se.code });
    return { ...base, ok: false, steps };
  }

  return { ...base, ok: true, steps, publicUrl: getPublicUrl(key) };
}
