type RuntimeEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_APP_URL?: string;
  APP_URL?: string;
};

export function getPublicAppOrigin(env: RuntimeEnv = process.env) {
  const configuredUrl = env.NEXT_PUBLIC_APP_URL?.trim() || env.APP_URL?.trim();
  if (!configuredUrl) {
    if (env.NODE_ENV === "production") {
      throw new Error("[auth] NEXT_PUBLIC_APP_URL یا APP_URL باید در production تنظیم شود.");
    }
    return "http://localhost:3000";
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("[auth] NEXT_PUBLIC_APP_URL یا APP_URL یک URL معتبر نیست.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("[auth] URL عمومی برنامه باید HTTP یا HTTPS باشد.");
  }
  return url.origin;
}

export function getPublicAppOriginSource(env: RuntimeEnv = process.env) {
  if (env.NEXT_PUBLIC_APP_URL?.trim()) return "NEXT_PUBLIC_APP_URL";
  if (env.APP_URL?.trim()) return "APP_URL";
  return "development localhost fallback";
}

export function resolveInternalRedirect(
  path: string | null | undefined,
  fallback = "/books",
  env: RuntimeEnv = process.env,
) {
  const origin = getPublicAppOrigin(env);
  const candidate = path?.trim();
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return new URL(fallback, origin);
  }
  const destination = new URL(candidate, origin);
  return destination.origin === origin ? destination : new URL(fallback, origin);
}
