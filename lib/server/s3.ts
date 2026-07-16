import { setDefaultResultOrder } from "node:dns";
import { Agent as HttpsAgent } from "node:https";
import { Agent as HttpAgent } from "node:http";

import {
  HeadBucketCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
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
const region = process.env.S3_REGION || "auto";
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

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
    readonly diagnostic?: Record<string, unknown>,
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "StorageError";
  }
}

function assertS3Config() {
  const missing = [
    ["S3_ENDPOINT", endpoint],
    ["S3_BUCKET", bucket],
    ["S3_ACCESS_KEY_ID", accessKeyId],
    ["S3_SECRET_ACCESS_KEY", secretAccessKey],
    ["S3_PUBLIC_BASE_URL", publicBaseUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    console.error("[s3] preflight guard failed", { stage: "config_validation", sourceKey: null, destinationKey: null, mediaKind: null, folder: null, contentType: null, extension: null, bucketConfigured: Boolean(bucket), clientExists: Boolean(cachedClient), requiredConfig: { endpoint: Boolean(endpoint), bucket: Boolean(bucket), accessKeyId: Boolean(accessKeyId), secretAccessKey: Boolean(secretAccessKey), publicBaseUrl: Boolean(publicBaseUrl) }, failedGuard: `missing_config:${missing.join(",")}` });
    throw new StorageError(
      `S3 configuration is incomplete. Missing: ${missing.join(", ")}.`,
      "STORAGE_CONFIG",
      undefined,
      { stage: "config_validation", failedGuard: `missing_config:${missing.join(",")}`, bucketConfigured: Boolean(bucket), clientExists: Boolean(cachedClient), requiredConfig: { endpoint: Boolean(endpoint), bucket: Boolean(bucket), accessKeyId: Boolean(accessKeyId), secretAccessKey: Boolean(secretAccessKey), publicBaseUrl: Boolean(publicBaseUrl) } },
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
  // assertS3Config runs before every upload, so this must be configured.
  return `${publicBaseUrl!.replace(/\/+$/, "")}/${key}`;
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
  if (err instanceof StorageError) return err;
  const e = err as
    | { code?: string; name?: string; message?: string; $metadata?: { httpStatusCode?: number } }
    | null;
  const status = e?.$metadata?.httpStatusCode;
  const diagnostic = {
    functionName: "toStorageError",
    stage: step,
    providerErrorCode: e?.code ?? e?.name ?? null,
    requestId: (e as { $metadata?: { requestId?: string } })?.$metadata?.requestId ?? null,
    httpStatus: status ?? null,
  };
  console.error("[s3] operation failed", {
    step,
    errorCode: e?.code,
    errorName: e?.name,
    httpStatus: status,
    requestId: (e as { $metadata?: { requestId?: string; extendedRequestId?: string } })?.$metadata?.requestId,
    extendedRequestId: (e as { $metadata?: { extendedRequestId?: string } })?.$metadata?.extendedRequestId,
    message: e?.message,
  });

  if (isTimeoutError(err)) {
    return new StorageError(`Storage timeout during ${step}.`, "STORAGE_TIMEOUT", err, diagnostic);
  }
  if (isConnectionError(err)) {
    return new StorageError(`Storage unreachable during ${step}.`, "STORAGE_UNREACHABLE", err, diagnostic);
  }
  if (status === 403 || e?.name === "AccessDenied") {
    return new StorageError(`Storage access denied during ${step}.`, "STORAGE_FORBIDDEN", err, diagnostic);
  }
  return new StorageError(
    `Storage error during ${step}: ${e?.name || e?.code || "unknown"}.`,
    "STORAGE_UNKNOWN",
    err,
    diagnostic,
  );
}

export async function uploadImageToS3(params: {
  buffer: Buffer;
  contentType: string;
  filename: string;
  folder: ImageUploadFolder;
  objectKey?: string;
  metadata?: Record<string, string>;
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
    key,
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
        Metadata: params.metadata,
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
    key,
    durationMs: Date.now() - started,
  });

  return { key, url: getPublicUrl(key) };
}

export async function deleteImageFromS3(key: string): Promise<void> {
  const client = getClient();
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    throw toStorageError(err, "DeleteObject");
  }
}

export type StoredImageMetadata = { key: string; sizeBytes: number; contentType: string | null; etag: string | null; metadata: Record<string, string> };
export async function headImageInS3(key: string): Promise<StoredImageMetadata | null> {
  const client = getClient();
  try { const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return { key, sizeBytes: Number(result.ContentLength ?? 0), contentType: result.ContentType ?? null, etag: result.ETag ?? null, metadata: result.Metadata ?? {} }; }
  catch (error) { const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode; if (status === 404) return null; throw toStorageError(error, "HeadObject"); }
}
export async function copyImageInS3(input: { sourceKey: string; destinationKey: string; contentType?: string; metadata?: Record<string, string> }): Promise<void> {
  const client = getClient();
  const sourceKey = input.sourceKey.trim().replace(/^\/+/, "");
  const destinationKey = input.destinationKey.trim().replace(/^\/+/, "");
  const copySource = buildCopySource(sourceKey);
  console.info("[s3] preflight before CopyObject", { stage: "copy_preflight", sourceKey, destinationKey, mediaKind: "image", folder: destinationKey.split("/")[0], contentType: input.contentType ?? null, extension: destinationKey.split(".").pop() ?? null, bucketConfigured: Boolean(bucket), clientExists: Boolean(cachedClient), requiredConfig: { endpoint: Boolean(endpoint), bucket: Boolean(bucket), accessKeyId: Boolean(accessKeyId), secretAccessKey: Boolean(secretAccessKey), publicBaseUrl: Boolean(publicBaseUrl) } });
  const started = Date.now();
  console.info("[s3] CopyObject start", { sourceKey, destinationKey, bucket, copySource, mediaType: input.contentType, forcePathStyle: true, command: `CopyObject(Bucket=${bucket}, Key=${destinationKey}, CopySource=${copySource})` });
  try {
    const result = await client.send(new CopyObjectCommand({ Bucket: bucket, Key: destinationKey, CopySource: copySource, ACL: "public-read", ContentType: input.contentType, Metadata: input.metadata, MetadataDirective: input.contentType || input.metadata ? "REPLACE" : "COPY", CacheControl: "public, max-age=31536000, immutable" }));
    console.info("[s3] CopyObject OK", { sourceKey, destinationKey, bucket, durationMs: Date.now() - started, etag: result.CopyObjectResult?.ETag, requestId: result.$metadata.requestId, httpStatus: result.$metadata.httpStatusCode });
  } catch (error) {
    console.error("[s3] CopyObject FAILED", { sourceKey, destinationKey, bucket, copySource, durationMs: Date.now() - started, mediaType: input.contentType, error });
    console.warn("[s3] CopyObject fallback starting", { sourceKey, destinationKey, bucket, providerErrorCode: (error as { Code?: string; code?: string })?.Code ?? (error as { code?: string })?.code, httpStatus: (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode });
    let lastCheckpoint = "before_fallback_get";
    let fallbackGetObject: Record<string, unknown> = { ok: false };
    let fallbackPutObject: Record<string, unknown> = { ok: false };
    let headObject: Record<string, unknown> = { ok: false };
    try {
      const getStarted = Date.now();
      const source = await client.send(new GetObjectCommand({ Bucket: bucket, Key: sourceKey }));
      fallbackGetObject = { ok: true, requestId: source.$metadata.requestId ?? null };
      const body = source.Body;
      if (!body || typeof body.transformToByteArray !== "function") throw new Error("GET_OBJECT_BODY_UNAVAILABLE");
      const bytes = await body.transformToByteArray();
      console.info("[s3] fallback GetObject OK", { sourceKey, bytes: bytes.byteLength, durationMs: Date.now() - getStarted, requestId: source.$metadata.requestId, httpStatus: source.$metadata.httpStatusCode });
      lastCheckpoint = "before_fallback_put";
      const putStarted = Date.now();
      const put = await client.send(new PutObjectCommand({ Bucket: bucket, Key: destinationKey, Body: bytes, ContentType: input.contentType ?? source.ContentType ?? "application/octet-stream", Metadata: input.metadata, ACL: "public-read", CacheControl: "public, max-age=31536000, immutable" }));
      fallbackPutObject = { ok: true, requestId: put.$metadata.requestId ?? null };
      console.info("[s3] fallback PutObject OK", { destinationKey, bytes: bytes.byteLength, durationMs: Date.now() - putStarted, etag: put.ETag, requestId: put.$metadata.requestId, httpStatus: put.$metadata.httpStatusCode });
      lastCheckpoint = "before_destination_head";
      const verified = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: destinationKey }));
      headObject = { ok: true, requestId: verified.$metadata.requestId ?? null };
      if (!verified.ContentLength || verified.ContentLength < 1) throw new Error("FALLBACK_DESTINATION_EMPTY");
      console.info("[s3] fallback destination verified", { destinationKey, sizeBytes: verified.ContentLength, requestId: verified.$metadata.requestId, httpStatus: verified.$metadata.httpStatusCode });
    } catch (fallbackError) {
      console.error("[s3] CopyObject fallback FAILED", { sourceKey, destinationKey, bucket, fallbackError, originalError: error, finalProviderErrorCode: (fallbackError as { Code?: string; code?: string })?.Code ?? (fallbackError as { code?: string })?.code, finalHttpStatus: (fallbackError as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode });
      const providerError = (error as { Code?: string; code?: string })?.Code ?? (error as { code?: string })?.code;
      const finalProviderError = (fallbackError as { Code?: string; code?: string })?.Code ?? (fallbackError as { code?: string })?.code;
      if (fallbackError instanceof Error && !("cause" in fallbackError))
        Object.defineProperty(fallbackError, "cause", { value: error, configurable: true });
      const converted = toStorageError(fallbackError, lastCheckpoint);
      throw new StorageError(
        converted.message,
        converted.code,
        fallbackError,
        { functionName: "copyImageInS3", stage: lastCheckpoint, lastCheckpoint, sourceKey, destinationKey, copyObject: { ok: false, providerErrorCode: providerError }, fallbackGetObject, fallbackPutObject, headObject, finalProviderErrorCode: finalProviderError, requestId: (fallbackError as { $metadata?: { requestId?: string } })?.$metadata?.requestId ?? null },
      );
    }
  }
}

/** Arvan uses path-style addressing; CopySource is bucket plus an RFC3986-encoded key. */
export function buildCopySource(sourceKey: string, sourceBucket = bucket ?? ""): string {
  return `${sourceBucket}/${encodeURIComponent(sourceKey.replace(/^\/+/, "")).replace(/%2F/gi, "/")}`;
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
