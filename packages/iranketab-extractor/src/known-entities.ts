import type { GhafasehCountry } from "./contract.js";

type CountryInfo = {
  name: string;
  originalName: string | null;
  slug: string;
};

type AuthorInfo = {
  originalName: string;
  slug: string;
  country: CountryInfo;
};

type PersonInfo = {
  slug: string;
  country?: CountryInfo;
};

type PublisherInfo = {
  name: string;
  slug: string;
};

type BookInfo = {
  originalTitle?: string;
  slug: string;
  firstPublishedYear?: number;
  country?: CountryInfo;
  description?: string;
};

const COUNTRIES = {
  iran: { name: "ایران", originalName: "Iran", slug: "iran" },
  italy: { name: "ایتالیا", originalName: "Italy", slug: "italy" },
  russia: { name: "روسیه", originalName: "Russia", slug: "russia" },
  france: { name: "فرانسه", originalName: "France", slug: "france" }
} as const satisfies Record<string, CountryInfo>;

export const KNOWN_AUTHORS = new Map<string, AuthorInfo>([
  ["اومبرتو اکو", { originalName: "Umberto Eco", slug: "umberto-eco", country: COUNTRIES.italy }],
  ["فئودور داستایفسکی", { originalName: "Fyodor Dostoevsky", slug: "fyodor-dostoevsky", country: COUNTRIES.russia }],
  ["آنتون چخوف", { originalName: "Anton Chekhov", slug: "anton-chekhov", country: COUNTRIES.russia }],
  ["ویکتور هوگو", { originalName: "Victor Hugo", slug: "victor-hugo", country: COUNTRIES.france }],
  ["صادق هدایت", { originalName: "Sadegh Hedayat", slug: "sadegh-hedayat", country: COUNTRIES.iran }],
  ["بهرام صادقی", { originalName: "Bahram Sadeghi", slug: "bahram-sadeghi", country: COUNTRIES.iran }]
]);

export const KNOWN_TRANSLATORS = new Map<string, PersonInfo>([
  ["رضا علیزاده", { slug: "reza-alizadeh", country: COUNTRIES.iran }],
  ["سروش حبیبی", { slug: "soroush-habibi", country: COUNTRIES.iran }],
  ["حمیدرضا آتش برآب", { slug: "hamidreza-atash-bar-ab", country: COUNTRIES.iran }],
  ["پرویز همتیان بروجنی", { slug: "parviz-hemmatian-boroujeni", country: COUNTRIES.iran }],
  ["هانیه چوپانی", { slug: "hanieh-choopani", country: COUNTRIES.iran }],
  ["بابک شهاب", { slug: "babak-shahab", country: COUNTRIES.iran }],
  ["مهناز مهری", { slug: "mahnaz-mehri", country: COUNTRIES.iran }],
  ["فرید مرادی", { slug: "farid-moradi", country: COUNTRIES.iran }],
  ["رضا ستوده", { slug: "reza-sotoudeh", country: COUNTRIES.iran }],
  ["سوگند اکبریان", { slug: "sogand-akbarian", country: COUNTRIES.iran }],
  ["نیما سرلک", { slug: "nima-sarlak", country: COUNTRIES.iran }],
  ["گندم نسرکانی", { slug: "gandom-naserkani", country: COUNTRIES.iran }],
  ["میرمجید عمرانی", { slug: "mirmajid-omrani", country: COUNTRIES.iran }],
  ["محمدجواد نعمتی", { slug: "mohammadjavad-nemati", country: COUNTRIES.iran }],
  ["زهره گیوی", { slug: "zohreh-givi", country: COUNTRIES.iran }],
  ["موسسه اندیشه ناب فردا", { slug: "moassese-andisheh-nab-farda", country: COUNTRIES.iran }],
  ["قاسم کبیری", { slug: "ghasem-kabiri", country: COUNTRIES.iran }],
  ["نسرین مجیدی", { slug: "nasrin-majidi", country: COUNTRIES.iran }],
  ["محسن رحمانی", { slug: "mohsen-rahmani", country: COUNTRIES.iran }],
  ["نسرین دورقی زاده", { slug: "nasrin-dooraghi-zadeh", country: COUNTRIES.iran }],
  ["زهرا خانلری (کیا)", { slug: "zahra-khanlari-kia", country: COUNTRIES.iran }],
  ["فاطمه صادقی (1377)", { slug: "fatemeh-sadeghi-1377", country: COUNTRIES.iran }],
  ["محمد شعبانی", { slug: "mohammad-shabani", country: COUNTRIES.iran }]
]);

export const KNOWN_PUBLISHERS = new Map<string, PublisherInfo>([
  ["روزنه", { name: "روزنه", slug: "roozaneh" }],
  ["نشر روزنه", { name: "روزنه", slug: "roozaneh" }],
  ["ماهی", { name: "ماهی", slug: "mahi" }],
  ["نشر ماهی", { name: "ماهی", slug: "mahi" }],
  ["نگاه", { name: "نگاه", slug: "negah" }],
  ["نشر نگاه", { name: "نگاه", slug: "negah" }],
  ["کتاب پارسه", { name: "کتاب پارسه", slug: "ketab-parseh" }],
  ["نشر کتاب پارسه", { name: "کتاب پارسه", slug: "ketab-parseh" }],
  ["چشمه", { name: "چشمه", slug: "cheshmeh" }],
  ["نشر چشمه", { name: "چشمه", slug: "cheshmeh" }],
  ["امیرکبیر", { name: "امیرکبیر", slug: "amirkabir" }],
  ["نشر امیرکبیر", { name: "امیرکبیر", slug: "amirkabir" }],
  ["کتاب کوله پشتی", { name: "کتاب کوله پشتی", slug: "ketab-kooleh-poshti" }],
  ["وال", { name: "وال", slug: "val" }],
  ["بهنود", { name: "بهنود", slug: "behnood" }],
  ["نشر بهنود", { name: "بهنود", slug: "behnood" }],
  ["قدیانی", { name: "قدیانی", slug: "ghadyani" }],
  ["عطر کاج", { name: "عطر کاج", slug: "atr-kaj" }],
  ["فرمهر", { name: "فرمهر", slug: "farmehr" }],
  ["آزرمیدخت", { name: "آزرمیدخت", slug: "azarmidokht" }],
  ["مهراندیش", { name: "مهراندیش", slug: "mehrandish" }],
  ["یوشیتا", { name: "یوشیتا", slug: "yushita" }],
  ["آلاچیق", { name: "آلاچیق", slug: "alachigh" }],
  ["آد", { name: "آد", slug: "aad" }],
  ["نشر آد", { name: "آد", slug: "aad" }],
  ["فردوس", { name: "فردوس", slug: "ferdows" }],
  ["روزگار", { name: "روزگار", slug: "roozegar" }],
  ["شیرمحمدی", { name: "شیرمحمدی", slug: "shirmohammadi" }],
  ["تیموری", { name: "تیموری", slug: "teymouri" }],
  ["جامی", { name: "جامی", slug: "jami" }],
  ["سفیر قلم", { name: "سفیر قلم", slug: "safir-ghalam" }],
  ["آقایی", { name: "آقایی", slug: "aghaei" }]
]);

export const KNOWN_BOOKS = new Map<string, BookInfo>([
  [
    "آونگ فوکو",
    {
      originalTitle: "Foucault's Pendulum",
      slug: "foucaults-pendulum",
      firstPublishedYear: 1988,
      country: COUNTRIES.italy,
      description:
        "آونگ فوکو رمانی معمایی و تاریخی از اومبرتو اکو است که با ترکیب نمادشناسی، تاریخ، رازهای فرقه‌ای و بازی‌های ذهنی، مرز میان حقیقت و توهم را به چالش می‌کشد."
    }
  ],
  ["Foucault's Pendulum", { slug: "foucaults-pendulum" }],
  [
    "شب های روشن",
    {
      originalTitle: "White Nights",
      slug: "white-nights",
      firstPublishedYear: 1848,
      country: COUNTRIES.russia,
      description:
        "شب‌های روشن داستانی کوتاه از فئودور داستایفسکی درباره تنهایی، خیال‌پردازی و برخوردی کوتاه اما سرنوشت‌ساز در شب‌های سن‌پترزبورگ است."
    }
  ],
  [
    "شب‌های روشن",
    {
      originalTitle: "White Nights",
      slug: "white-nights",
      firstPublishedYear: 1848,
      country: COUNTRIES.russia,
      description:
        "شب‌های روشن داستانی کوتاه از فئودور داستایفسکی درباره تنهایی، خیال‌پردازی و برخوردی کوتاه اما سرنوشت‌ساز در شب‌های سن‌پترزبورگ است."
    }
  ]
]);

export function toCountry(value: CountryInfo | undefined): GhafasehCountry | null {
  return value
    ? { name: value.name, originalName: value.originalName, slug: value.slug }
    : null;
}




