import { db } from "@/db";
import { SiteSetting } from "@/db/schema";
import {
  BOOLEAN_SETTING_KEYS,
  SITE_SETTINGS_DEFAULTS,
  type SiteSettings,
} from "@/lib/settings/types";

// کش سبکِ درون‌حافظه‌ای برای خواندن تنظیمات. تنظیمات کم‌تغییر و پرخوانده‌اند
// (هدر، متادیتا، …)، پس یک TTL کوتاه بار دیتابیس را به‌شدت کم می‌کند بدون اینکه
// تغییرات ادمین دیر اعمال شوند. هر نوشتن کش را باطل می‌کند.
const CACHE_TTL_MS = 60_000;

let cache: { value: SiteSettings; expiresAt: number } | null = null;

const BOOLEAN_KEYS = new Set<string>(BOOLEAN_SETTING_KEYS as string[]);

function rowsToSettings(rows: { key: string; value: string | null }[]): SiteSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = { ...SITE_SETTINGS_DEFAULTS };

  for (const key of Object.keys(out) as (keyof SiteSettings)[]) {
    if (!map.has(key)) continue;
    const raw = map.get(key);
    if (raw === null || raw === undefined) continue;

    if (BOOLEAN_KEYS.has(key)) {
      (out[key] as boolean) = raw === "true";
    } else {
      (out[key] as string) = raw;
    }
  }
  return out;
}

/**
 * تنظیمات سایت را برمی‌گرداند؛ مقادیر نبود در دیتابیس از پیش‌فرض‌ها پر می‌شوند.
 * نتیجه برای مدت کوتاهی کش می‌شود (هر نوشتن کش را پاک می‌کند).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  let value: SiteSettings;
  try {
    const rows = await db
      .select({ key: SiteSetting.key, value: SiteSetting.value })
      .from(SiteSetting);
    value = rowsToSettings(rows);
  } catch {
    // اگر جدول هنوز migrate نشده باشد، به‌جای کرش‌کردنِ صفحه‌های عمومی،
    // به پیش‌فرض‌ها برمی‌گردیم.
    value = { ...SITE_SETTINGS_DEFAULTS };
  }

  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

/** کش خواندن را باطل می‌کند (پس از نوشتن). */
export function invalidateSiteSettingsCache(): void {
  cache = null;
}

function settingsToRows(
  settings: SiteSettings,
): { key: string; value: string }[] {
  return (Object.keys(settings) as (keyof SiteSettings)[]).map((key) => {
    const v = settings[key];
    return { key, value: typeof v === "boolean" ? String(v) : String(v ?? "") };
  });
}

/**
 * تنظیمات را به‌صورت اتمیک ذخیره می‌کند: کل مجموعه در یک تراکنش upsert می‌شود،
 * پس یا همه‌ی تغییرات اعمال می‌شوند یا هیچ‌کدام. مقدار نهاییِ ذخیره‌شده برمی‌گردد.
 */
export async function updateSiteSettings(
  settings: SiteSettings,
): Promise<SiteSettings> {
  const now = new Date();
  const rows = settingsToRows(settings).map((r) => ({ ...r, updatedAt: now }));

  await db.transaction(async (tx) => {
    for (const row of rows) {
      await tx
        .insert(SiteSetting)
        .values(row)
        .onConflictDoUpdate({
          target: SiteSetting.key,
          set: { value: row.value, updatedAt: now },
        });
    }
  });

  invalidateSiteSettingsCache();
  // تضمین تازگی: مستقیماً مقدار ذخیره‌شده را برمی‌گردانیم.
  const saved = { ...SITE_SETTINGS_DEFAULTS, ...settings };
  cache = { value: saved, expiresAt: Date.now() + CACHE_TTL_MS };
  return saved;
}
