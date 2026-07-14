import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  unique,
  uniqueIndex,
  index,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------- Enums ----------------
export const BookFormat = pgEnum("BookFormat", ["PHYSICAL", "ELECTRONIC"]);
export const BookStatus = pgEnum("BookStatus", [
  "UNREAD",
  "READING",
  "FINISHED",
]);

export const PurchasePriority = pgEnum("PurchasePriority", [
  "MUST_HAVE", // حتما باید بخرم
  "WANT_IT", // خیلی دلم می‌خواد
  "NICE_TO_HAVE", // بد نیست داشته باشم
  "IF_EXTRA_MONEY", // اگر پول اضافه داشتم
  "NOT_IMPORTANT", // فعلا مهم نیست
]);

// نمایانی پروفایل کاربر (حساب‌های جدید به‌صورت عمومی ساخته می‌شوند)
export const ProfileVisibility = pgEnum("ProfileVisibility", [
  "PUBLIC",
  "PRIVATE",
]);

// نقش کاربر برای دسترسی ادمین
export const UserRole = pgEnum("UserRole", ["USER", "ADMIN"]);

// وضعیت تأیید برای کاتالوگ و فهرست‌های مرجع
export const ApprovalStatus = pgEnum("ApprovalStatus", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const BlogPostStatus = pgEnum("BlogPostStatus", [
  "DRAFT",
  "PUBLISHED",
]);

export const NoteScope = pgEnum("NoteScope", ["book", "edition"]);

// وضعیت انتشار صفحه‌ی ثابت (درباره ما، تماس، قوانین، …)
export const StaticPageStatus = pgEnum("StaticPageStatus", [
  "DRAFT",
  "PUBLISHED",
]);

export const VerificationCodePurpose = pgEnum("VerificationCodePurpose", [
  "email_verification",
  "login",
  "password_reset",
]);

export const AuthProvider = pgEnum("AuthProvider", [
  "password",
  "google",
  "otp",
]);

// نوع داده‌ی مرجع مدیریت‌شده توسط ادمین
export const ReferenceType = pgEnum("ReferenceType", [
  "AUTHOR",
  "GENRE",
  "TRANSLATOR",
  "PUBLISHER",
  "COUNTRY",
]);

// فروشگاه/پلتفرمِ لینک بیرونیِ کتاب
export const ExternalLinkProvider = pgEnum("ExternalLinkProvider", [
  "taaghche",
  "fidibo",
  "iranketab",
  "ketabrah",
  "digikala",
  "publisher",
  "other",
]);

// نوع نسخه‌ی لینک بیرونی
export const ExternalLinkType = pgEnum("ExternalLinkType", [
  "print",
  "ebook",
  "audiobook",
  "unknown",
]);

// ---------------- User ----------------
export const User = pgTable("User", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // تصویر کاور/بنر پروفایل (پس‌زمینه‌ی هدر، شبیه توییتر)
  profileBannerImage: text("profile_banner_image"),
  authProvider: AuthProvider("auth_provider").default("password").notNull(),
  googleId: text("google_id").unique(),
  password: text("password"),
  passwordHash: text("password_hash"),
  // ---- فیلدهای پروفایل (فاز ۲) ----
  username: varchar("username", { length: 30 }).unique(),
  bio: varchar("bio", { length: 500 }),
  location: varchar("location", { length: 100 }),
  website: text("website"),
  instagram: varchar("instagram", { length: 100 }),
  twitter: varchar("twitter", { length: 100 }),
  linkedin: text("linkedin"),
  telegram: varchar("telegram", { length: 100 }),
  profileVisibility: ProfileVisibility("profile_visibility")
    .default("PUBLIC")
    .notNull(),
  role: UserRole("role").default("USER").notNull(),
  sessionVersion: integer("session_version").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------- ReferenceItem (فهرست‌های مرجع مدیریت‌شده توسط ادمین) ----------------
// یک جدول عمومی برای نویسنده/ژانر/مترجم/ناشر/کشور؛ مقادیر ادمین APPROVED و
// مقادیر پیشنهادی کاربر PENDING هستند.
export const ReferenceItem = pgTable(
  "ReferenceItem",
  {
    id: varchar("id")
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    type: ReferenceType("type").notNull(),
    name: text("name").notNull(),
    // فیلدهای صفحه‌ی عمومی موجودیت (نویسنده/ژانر/…). nullable برای سازگاری.
    slug: text("slug"),
    coverImage: text("cover_image"),
    bannerImage: text("banner_image"),
    originalName: text("original_name"),
    description: text("description"),
    shortDescription: text("short_description"),
    imageFilename: text("image_filename"),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    birthYear: integer("birth_year"),
    deathYear: integer("death_year"),
    countryName: text("country_name"),
    countrySlug: text("country_slug"),
    website: text("website"),
    status: ApprovalStatus("status").default("PENDING").notNull(),
    createdById: varchar("created_by_id").references(() => User.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => ({
    // اسلاگ یکتا در هر نوع (نویسنده و ناشر هم‌نام مجازند).
    typeSlugUnique: unique("ReferenceItem_type_slug_unique").on(t.type, t.slug),
  })
);

// ---------------- PasswordResetToken ----------------
// فقط هش توکن ذخیره می‌شود؛ توکن خام هرگز در دیتابیس نگهداری نمی‌شود.
export const PasswordResetToken = pgTable("PasswordResetToken", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  usedAt: timestamp("used_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const VerificationCode = pgTable(
  "VerificationCode",
  {
    id: varchar("id")
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull(),
    codeHash: text("code_hash").notNull(),
    purpose: VerificationCodePurpose("purpose").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    consumedAt: timestamp("consumed_at", { mode: "date" }),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => ({
    emailPurposeIdx: index("VerificationCode_email_purpose_idx").on(
      t.email,
      t.purpose
    ),
    expiresAtIdx: index("VerificationCode_expires_at_idx").on(t.expiresAt),
  })
);

// ---------------- Account ----------------
export const Account = pgTable("Account", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

// ---------------- Session ----------------
export const Session = pgTable("Session", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").unique().notNull(),
  userId: varchar("user_id")
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ---------------- VerificationToken ----------------
export const VerificationToken = pgTable("VerificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ---------------- CatalogBook (هویت کانونی کتاب در کاتالوگ سراسری) ----------------
// کتاب‌هایی که روی پلتفرم وجود دارند و همه‌ی کاربران می‌توانند جست‌وجو و انتخابشان کنند.
export const CatalogBook = pgTable("CatalogBook", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  slug: text("slug").unique(),
  originalTitle: text("original_title"),
  description: text("description"),
  coverImage: text("cover_image"),
  author: text("author").notNull(),
  language: varchar("language", { length: 50 }),
  genre: text("genre"),
  country: text("country"),
  firstPublishedYear: integer("first_published_year"),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  // وضعیت تأیید برای نمایش در کاتالوگ عمومی (پیش‌فرض APPROVED؛ ساخت دستی PENDING)
  status: ApprovalStatus("status").default("APPROVED").notNull(),
  primaryEditionId: varchar("primary_edition_id"),
  // کاربری که این کتاب کانونی را ساخته (برای حسابرسی؛ با حذف کاربر null می‌شود)
  createdById: varchar("created_by_id").references(() => User.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------- BookEdition (نسخه/چاپ مشخص از یک کتاب کانونی) ----------------
export const BookEdition = pgTable("BookEdition", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  catalogBookId: varchar("catalog_book_id")
    .notNull()
    .references(() => CatalogBook.id, { onDelete: "cascade" }),
  titleOverride: text("title_override"),
  translator: text("translator"),
  publisher: text("publisher"),
  isbn: varchar("isbn", { length: 20 }),
  isbn10: varchar("isbn10", { length: 20 }),
  isbn13: varchar("isbn13", { length: 20 }),
  format: BookFormat("format").notNull().default("PHYSICAL"),
  coverImage: text("cover_image"),
  coverFilename: text("cover_filename"),
  publishedYear: integer("published_year"),
  editionLabel: text("edition_label"),
  editionDescription: text("edition_description"),
  pageCount: integer("page_count"),
  language: varchar("language", { length: 50 }),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  sourceEditionCode: text("source_edition_code"),
  status: ApprovalStatus("status").default("APPROVED").notNull(),
  createdById: varchar("created_by_id").references(() => User.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------- BookExternalLink (لینک‌های خرید/مطالعه‌ی بیرونی) ----------------
// مدل مقیاس‌پذیر: به‌جای یک ستون برای هر فروشگاه، هر لینک یک ردیف است. هویت
// کانونی = CatalogBook؛ editionId اختیاری برای لینک‌های مخصوص یک نسخه.
export const BookExternalLink = pgTable(
  "BookExternalLink",
  {
    id: varchar("id")
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    catalogBookId: varchar("catalog_book_id")
      .notNull()
      .references(() => CatalogBook.id, { onDelete: "cascade" }),
    editionId: varchar("edition_id").references(() => BookEdition.id, {
      onDelete: "set null",
    }),
    provider: ExternalLinkProvider("provider").notNull(),
    label: text("label"),
    url: text("url").notNull(),
    type: ExternalLinkType("type").notNull().default("unknown"),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => ({
    catalogIdx: index("BookExternalLink_catalog_idx").on(t.catalogBookId),
    providerIdx: index("BookExternalLink_provider_idx").on(t.provider),
    activeIdx: index("BookExternalLink_active_idx").on(t.isActive),
    // از لینک تکراریِ یک فروشگاه با همان URL برای یک کتاب جلوگیری می‌کند.
    catalogProviderUrlUnique: unique(
      "BookExternalLink_catalog_provider_url_unique",
    ).on(t.catalogBookId, t.provider, t.url),
  }),
);

// ---------------- Book (ردیف کتابخانه‌ی شخصی کاربر) ----------------
export const Book = pgTable("Book", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  title: text("title").notNull(),
  // اسلاگ خوانا برای URL عمومی کتاب (یکتا). nullable برای ردیف‌های قدیمی؛
  // به‌صورت تنبل هنگام اولین مشاهده ساخته می‌شود اگر خالی باشد.
  slug: text("slug").unique(),
  // جلد اختیاری است؛ در نبود آن از تصویر پیش‌فرض استفاده می‌شود
  coverImage: text("cover_image"),
  author: text("author").notNull(),
  translator: text("translator"),
  description: text("description"),
  country: text("country"),
  genre: text("genre").notNull(),
  pageCount: integer("page_count"),
  format: BookFormat("format").notNull(),
  publisher: text("publisher"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: varchar("user_id")
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  status: BookStatus("status").default("UNREAD").notNull(),
  progress: integer("progress"),
  rating: integer("rating"),
  review: text("review"),
  // حس/حال‌وهوای شخصی کاربر از کتاب (چندتایی). nullable برای سازگاری با ردیف‌های قدیمی.
  moodTags: text("mood_tags").array(),
  // علاقه‌مندی صریح کاربر (مستقل از امتیاز)
  isFavorite: boolean("is_favorite").default(false).notNull(),
  // پیوند اختیاری به کاتالوگ سراسری (در حالت افزودن از کاتالوگ پر می‌شود؛
  // برای کتاب‌های دستیِ قدیمی/مستقل null می‌ماند)
  catalogBookId: varchar("catalog_book_id").references(() => CatalogBook.id, {
    onDelete: "set null",
  }),
  editionId: varchar("edition_id").references(() => BookEdition.id, {
    onDelete: "set null",
  }),
});

// ---------------- Quote ----------------
export const Quote = pgTable(
  "Quote",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    imageKey: text("image_key"),
    page: integer("page"),
    catalogBookId: varchar("catalog_book_id").references(() => CatalogBook.id, {
      onDelete: "set null",
    }),
    bookEditionId: varchar("book_edition_id").references(() => BookEdition.id, {
      onDelete: "set null",
    }),
    bookId: varchar("book_id")
      .notNull()
      .references(() => Book.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    imageKeyUnique: uniqueIndex("Quote_image_key_unique").on(table.imageKey),
    bookIdx: index("Quote_book_id_idx").on(table.bookId),
    userIdx: index("Quote_user_id_idx").on(table.userId),
    createdAtIdx: index("Quote_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("Quote_updated_at_idx").on(table.updatedAt),
  }),
);

// ---------------- QuoteLike (پسند نقل‌قول؛ هر کاربر یک‌بار) ----------------
// مدل افزایشی و کم‌هزینه: شمار پسندها از روی تعداد ردیف‌ها محاسبه می‌شود و
// قید یکتایی (quote_id, user_id) از پسند تکراری جلوگیری می‌کند.
export const QuoteLike = pgTable(
  "QuoteLike",
  {
    id: varchar("id")
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    quoteId: varchar("quote_id")
      .notNull()
      .references(() => Quote.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueQuoteUser: unique("QuoteLike_quote_user_unique").on(
      t.quoteId,
      t.userId
    ),
  })
);

// ---------------- PublishedBookNote (یادداشت عمومیِ منتشرشده درباره‌ی کتاب) ----------------
// جدا از review/توضیحات خصوصیِ ردیف Book؛ فقط یادداشت‌هایی که کاربر آگاهانه
// منتشر می‌کند اینجا ذخیره می‌شوند و در پروفایل عمومی دیده می‌شوند (تابع حریم
// خصوصی پروفایل). وجود ردیف یعنی «منتشرشده».
export const PublishedBookNote = pgTable("PublishedBookNote", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").references(() => Book.id, { onDelete: "cascade" }),
  catalogBookId: varchar("catalog_book_id").references(() => CatalogBook.id, {
    onDelete: "cascade",
  }),
  bookEditionId: varchar("book_edition_id").references(() => BookEdition.id, {
    onDelete: "set null",
  }),
  scope: NoteScope("scope").default("book").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("PublishedBookNote_user_id_idx").on(table.userId),
  bookIdx: index("PublishedBookNote_book_id_idx").on(table.bookId),
  createdAtIdx: index("PublishedBookNote_created_at_idx").on(table.createdAt),
  updatedAtIdx: index("PublishedBookNote_updated_at_idx").on(table.updatedAt),
}));

// ---------------- PublishedBookNoteLike (پسند یادداشت عمومی؛ مثل QuoteLike) ----------------
export const PublishedBookNoteLike = pgTable(
  "PublishedBookNoteLike",
  {
    id: varchar("id")
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    noteId: varchar("note_id")
      .notNull()
      .references(() => PublishedBookNote.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueNoteUser: unique("PublishedBookNoteLike_note_user_unique").on(
      t.noteId,
      t.userId
    ),
  })
);

// ---------------- HomeFeaturedBook (کتاب‌های پیشنهادیِ انتخابیِ ادمین برای صفحه‌ی اصلی) ----------------
export const HomeFeaturedBook = pgTable("HomeFeaturedBook", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  // هویت کانونیِ کتاب (CatalogBook). انتخاب‌های جدید این را پر می‌کنند.
  catalogBookId: varchar("catalog_book_id")
    .unique()
    .references(() => CatalogBook.id, { onDelete: "cascade" }),
  // ردیف کتابخانه‌ی قدیمی؛ فقط برای سازگاری با انتخاب‌های پیش از نرمال‌سازی کاتالوگ.
  bookId: varchar("book_id")
    .unique()
    .references(() => Book.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------- HomeHeroSlide (اسلایدِ صفحه‌ی اصلیِ مدیریت‌شده توسط ادمین) ----------------
export const HomeHeroSlide = pgTable("HomeHeroSlide", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  badge: text("badge"),
  primaryCtaLabel: text("primary_cta_label"),
  primaryCtaHref: text("primary_cta_href"),
  secondaryCtaLabel: text("secondary_cta_label"),
  secondaryCtaHref: text("secondary_cta_href"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------- HomeHeroSlideBook (کتاب‌های انتخابیِ هر اسلاید؛ ۱ تا ۳) ----------------
export const HomeHeroSlideBook = pgTable("HomeHeroSlideBook", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  slideId: varchar("slide_id")
    .notNull()
    .references(() => HomeHeroSlide.id, { onDelete: "cascade" }),
  // هویت کانونیِ کتاب (CatalogBook). انتخاب‌های جدید این را پر می‌کنند.
  catalogBookId: varchar("catalog_book_id").references(() => CatalogBook.id, {
    onDelete: "cascade",
  }),
  // ردیف کتابخانه‌ی قدیمی؛ فقط برای سازگاری با انتخاب‌های قبلی.
  bookId: varchar("book_id").references(() => Book.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// ---------------- BlogCategory (دسته‌بندیِ مخصوص نوشته‌های بلاگ) ----------------
export const BlogCategory = pgTable("BlogCategory", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------- BlogPost ----------------
export const BlogPost = pgTable("BlogPost", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  // دسته‌بندیِ نوشته. nullable برای سازگاری با ردیف‌های قدیمی؛ در فرم الزامی است.
  // حذف دسته‌ای که نوشته دارد در سرویس مسدود می‌شود (RESTRICT).
  categoryId: varchar("category_id").references(() => BlogCategory.id, {
    onDelete: "restrict",
  }),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  bannerImage: text("banner_image").notNull(),
  status: BlogPostStatus("status").default("DRAFT").notNull(),
  createdById: varchar("created_by_id").references(() => User.id, {
    onDelete: "set null",
  }),
  publishedAt: timestamp("published_at", { mode: "date" }),
  readingTime: integer("reading_time"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------- SiteSetting (تنظیمات سراسری سایت؛ مدل کلید-مقدار) ----------------
// یک ردیف به‌ازای هر کلید تنظیم. مقادیر به‌صورت متن ذخیره می‌شوند (بولین‌ها
// "true"/"false") و در سرویس به شکل تایپ‌شده‌ی SiteSettings نرمال می‌شوند.
// مدل کلید-مقدار افزایشی است: افزودن تنظیم جدید نیازی به migration ندارد.
export const SiteSetting = pgTable("SiteSetting", {
  key: varchar("key", { length: 100 }).primaryKey().notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------- StaticPage (صفحات ثابتِ قابل‌ویرایش توسط ادمین) ----------------
// صفحه‌های عمومیِ ثابت مثل «درباره ما»، «تماس»، «قوانین»، «حریم خصوصی» و
// «راهنما». اسلاگ‌های هسته‌ای ثابت‌اند و در سرویس از حذف/تغییر محافظت می‌شوند؛
// محتوای HTML پیش از ذخیره و نمایش پاک‌سازی (sanitize) می‌شود.
export const StaticPage = pgTable("StaticPage", {
  id: varchar("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  content: text("content").default("").notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  status: StaticPageStatus("status").default("PUBLISHED").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------- Wishlist ----------------
export const Wishlist = pgTable("Wishlist", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  translator: text("translator"),
  publisher: text("publisher"),
  genre: text("genre"),
  note: text("note"),
  priority: PurchasePriority("priority").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  userId: varchar("user_id")
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
});

// ---------------- Relations ----------------
export const UserRelations = relations(User, ({ many }) => ({
  accounts: many(Account),
  books: many(Book),
  quotes: many(Quote),
  sessions: many(Session),
  wishlist: many(Wishlist),
  passwordResetTokens: many(PasswordResetToken),
  blogPosts: many(BlogPost),
}));

export const PasswordResetTokenRelations = relations(
  PasswordResetToken,
  ({ one }) => ({
    user: one(User, {
      fields: [PasswordResetToken.userId],
      references: [User.id],
    }),
  })
);

export const CatalogBookRelations = relations(CatalogBook, ({ many }) => ({
  editions: many(BookEdition),
  externalLinks: many(BookExternalLink),
  notes: many(PublishedBookNote),
  quotes: many(Quote),
}));

export const BookExternalLinkRelations = relations(
  BookExternalLink,
  ({ one }) => ({
    catalogBook: one(CatalogBook, {
      fields: [BookExternalLink.catalogBookId],
      references: [CatalogBook.id],
    }),
    edition: one(BookEdition, {
      fields: [BookExternalLink.editionId],
      references: [BookEdition.id],
    }),
  }),
);

export const BookEditionRelations = relations(BookEdition, ({ one, many }) => ({
  catalogBook: one(CatalogBook, {
    fields: [BookEdition.catalogBookId],
    references: [CatalogBook.id],
  }),
  libraryEntries: many(Book),
  notes: many(PublishedBookNote),
  quotes: many(Quote),
}));

export const BookRelations = relations(Book, ({ one, many }) => ({
  user: one(User, { fields: [Book.userId], references: [User.id] }),
  quotes: many(Quote),
  catalogBook: one(CatalogBook, {
    fields: [Book.catalogBookId],
    references: [CatalogBook.id],
  }),
  edition: one(BookEdition, {
    fields: [Book.editionId],
    references: [BookEdition.id],
  }),
}));

export const QuoteRelations = relations(Quote, ({ one, many }) => ({
  user: one(User, { fields: [Quote.userId], references: [User.id] }),
  book: one(Book, { fields: [Quote.bookId], references: [Book.id] }),
  catalogBook: one(CatalogBook, {
    fields: [Quote.catalogBookId],
    references: [CatalogBook.id],
  }),
  edition: one(BookEdition, {
    fields: [Quote.bookEditionId],
    references: [BookEdition.id],
  }),
  likes: many(QuoteLike),
}));

export const QuoteLikeRelations = relations(QuoteLike, ({ one }) => ({
  quote: one(Quote, { fields: [QuoteLike.quoteId], references: [Quote.id] }),
  user: one(User, { fields: [QuoteLike.userId], references: [User.id] }),
}));

export const PublishedBookNoteRelations = relations(
  PublishedBookNote,
  ({ one, many }) => ({
    user: one(User, {
      fields: [PublishedBookNote.userId],
      references: [User.id],
    }),
    book: one(Book, {
      fields: [PublishedBookNote.bookId],
      references: [Book.id],
    }),
    catalogBook: one(CatalogBook, {
      fields: [PublishedBookNote.catalogBookId],
      references: [CatalogBook.id],
    }),
    edition: one(BookEdition, {
      fields: [PublishedBookNote.bookEditionId],
      references: [BookEdition.id],
    }),
    likes: many(PublishedBookNoteLike),
  })
);

export const PublishedBookNoteLikeRelations = relations(
  PublishedBookNoteLike,
  ({ one }) => ({
    note: one(PublishedBookNote, {
      fields: [PublishedBookNoteLike.noteId],
      references: [PublishedBookNote.id],
    }),
    user: one(User, {
      fields: [PublishedBookNoteLike.userId],
      references: [User.id],
    }),
  })
);

export const AccountRelations = relations(Account, ({ one }) => ({
  user: one(User, { fields: [Account.userId], references: [User.id] }),
}));

export const WishlistRelations = relations(Wishlist, ({ one }) => ({
  user: one(User, { fields: [Wishlist.userId], references: [User.id] }),
}));

export const BlogPostRelations = relations(BlogPost, ({ one }) => ({
  author: one(User, {
    fields: [BlogPost.createdById],
    references: [User.id],
  }),
  category: one(BlogCategory, {
    fields: [BlogPost.categoryId],
    references: [BlogCategory.id],
  }),
}));

export const BlogCategoryRelations = relations(BlogCategory, ({ many }) => ({
  posts: many(BlogPost),
}));
