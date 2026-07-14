type Entry = { timestamps: number[]; active: number; recentUrls: Map<string, number> };
const entries = new Map<string, Entry>(); let globalActive = 0;
const WINDOW_MS = 60_000; const MAX_PER_WINDOW = 5; const DUPLICATE_MS = 5_000; const MAX_GLOBAL_ACTIVE = 3;

export function acquireIranKetabPreviewSlot(adminId: string, canonicalUrl: string, now = Date.now()): { release: () => void } | { code: "RATE_LIMITED" | "ALREADY_RUNNING" | "DUPLICATE_REQUEST"; message: string } {
  const entry = entries.get(adminId) ?? { timestamps: [], active: 0, recentUrls: new Map() };
  entry.timestamps = entry.timestamps.filter(value => now - value < WINDOW_MS);
  for (const [url, at] of entry.recentUrls) if (now - at >= DUPLICATE_MS) entry.recentUrls.delete(url);
  entries.set(adminId, entry);
  if (entry.active > 0 || globalActive >= MAX_GLOBAL_ACTIVE) return { code: "ALREADY_RUNNING", message: "یک درخواست استخراج دیگر در حال پردازش است." };
  if (entry.timestamps.length >= MAX_PER_WINDOW) return { code: "RATE_LIMITED", message: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید." };
  if (entry.recentUrls.has(canonicalUrl)) return { code: "DUPLICATE_REQUEST", message: "این لینک چند لحظه پیش بررسی شده است." };
  entry.timestamps.push(now); entry.recentUrls.set(canonicalUrl, now); entry.active += 1; globalActive += 1;
  let released = false; return { release: () => { if (released) return; released = true; entry.active = Math.max(0, entry.active - 1); globalActive = Math.max(0, globalActive - 1); } };
}

export function resetIranKetabPreviewLimiterForTests(): void { entries.clear(); globalActive = 0; }
