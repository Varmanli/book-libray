import { z } from "zod";

// شکل تایپ‌شده‌ی تنظیمات سایت. در دیتابیس به‌صورت کلید-مقدار ذخیره می‌شود؛
// این فایل مرجع واحدِ شکل، مقادیر پیش‌فرض و اعتبارسنجی است (مشترک کلاینت/سرور).

export const SETTINGS_THEMES = ["light", "dark", "system"] as const;
export type SettingsTheme = (typeof SETTINGS_THEMES)[number];

export interface SiteSettings {
  // عمومی
  siteName: string;
  siteDescription: string;
  siteLanguage: string;
  contactEmail: string;
  seoTitle: string;
  seoDescription: string;
  // برندینگ
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  // ظاهر
  defaultTheme: SettingsTheme;
  primaryColor: string;
  fontFamily: string;
  // شبکه‌های اجتماعی
  instagram: string;
  twitter: string;
  telegram: string;
  // سیستم
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  commentsEnabled: boolean;
}

export const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  siteName: "قفسه",
  siteDescription: "شبکه‌ی اجتماعی کتاب‌خوان‌ها",
  siteLanguage: "fa",
  contactEmail: "",
  seoTitle: "قفسه - کتابخانه شخصی",
  seoDescription: "مدیریت کتابخانه شخصی و کشف کتاب",
  logoUrl: "",
  faviconUrl: "",
  ogImageUrl: "",
  defaultTheme: "dark",
  primaryColor: "#2B6252",
  fontFamily: "",
  instagram: "",
  twitter: "",
  telegram: "",
  registrationEnabled: true,
  maintenanceMode: false,
  commentsEnabled: true,
};

const optionalText = (max: number) =>
  z.string().trim().max(max, `حداکثر ${max} نویسه مجاز است.`).default("");

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"), {
    message: "آدرس باید با http(s):// یا / شروع شود.",
  })
  .default("");

// رنگ هگز ۳ یا ۶ رقمی (یا خالی برای بازگشت به پیش‌فرض)
const hexColor = z
  .string()
  .trim()
  .max(7)
  .refine((v) => v === "" || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v), {
    message: "رنگ باید کد هگز معتبر باشد (مثل ‎#2B6252).",
  })
  .default("");

// اعتبارسنجی کاملِ سرور: همه‌ی فیلدها اختیاری‌اند تا ذخیره‌ی جزئی هم ممکن باشد،
// ولی هر فیلدِ ارسال‌شده باید معتبر باشد.
export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(1, "نام سایت الزامی است.").max(120),
  siteDescription: optionalText(500),
  siteLanguage: optionalText(10),
  contactEmail: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "ایمیل معتبر نیست.",
    })
    .default(""),
  seoTitle: optionalText(160),
  seoDescription: optionalText(320),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  ogImageUrl: optionalUrl,
  defaultTheme: z.enum(SETTINGS_THEMES).default("dark"),
  primaryColor: hexColor,
  fontFamily: optionalText(120),
  instagram: optionalText(120),
  twitter: optionalText(120),
  telegram: optionalText(120),
  registrationEnabled: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
  commentsEnabled: z.boolean().default(true),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

// کلیدهای بولین برای تبدیل امن متن↔بولین در لایه‌ی ذخیره‌سازی.
export const BOOLEAN_SETTING_KEYS: ReadonlyArray<keyof SiteSettings> = [
  "registrationEnabled",
  "maintenanceMode",
  "commentsEnabled",
];
