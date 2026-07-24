CREATE TYPE "public"."ApprovalStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."AuthProvider" AS ENUM('password', 'google', 'otp');--> statement-breakpoint
CREATE TYPE "public"."BlogPostStatus" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."CatalogBookContributorRole" AS ENUM('AUTHOR', 'TRANSLATOR');--> statement-breakpoint
CREATE TYPE "public"."ExternalLinkProvider" AS ENUM('taaghche', 'fidibo', 'iranketab', 'ketabrah', 'digikala', 'publisher', 'other');--> statement-breakpoint
CREATE TYPE "public"."ExternalLinkType" AS ENUM('print', 'ebook', 'audiobook', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."IranKetabImportEventType" AS ENUM('SESSION_CREATED', 'EXTRACTION_STARTED', 'EXTRACTION_COMPLETED', 'DRAFT_SAVED', 'COVER_PREPARATION_STARTED', 'COVER_PREPARATION_COMPLETED', 'CONTRIBUTOR_STEP_STARTED', 'CONTRIBUTOR_PROFILE_FETCH_STARTED', 'CONTRIBUTOR_PROFILE_FETCH_COMPLETED', 'CONTRIBUTOR_MATCHED', 'CONTRIBUTOR_CREATED', 'CONTRIBUTOR_UPDATED', 'CONTRIBUTOR_IGNORED', 'CONTRIBUTOR_IMAGE_STAGED', 'CONTRIBUTOR_FAILED', 'CONTRIBUTOR_STEP_COMPLETED', 'COMMIT_STARTED', 'COMMIT_COMPLETED', 'COMMIT_FAILED');--> statement-breakpoint
CREATE TYPE "public"."IranKetabImportStatus" AS ENUM('CREATED', 'EXTRACTING', 'PREVIEW_READY', 'DRAFT_REVIEW', 'COVER_PREPARATION', 'IMPORTING_REFERENCES', 'READY_TO_COMMIT', 'COMMITTING', 'SUCCESS', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."IranKetabPreviewOperationStatus" AS ENUM('PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."NoteScope" AS ENUM('book', 'edition');--> statement-breakpoint
CREATE TYPE "public"."ProfileVisibility" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."PublicBookThoughtType" AS ENUM('THOUGHT', 'QUOTE', 'REFLECTION');--> statement-breakpoint
CREATE TYPE "public"."PurchasePriority" AS ENUM('MUST_HAVE', 'WANT_IT', 'NICE_TO_HAVE', 'IF_EXTRA_MONEY', 'NOT_IMPORTANT');--> statement-breakpoint
CREATE TYPE "public"."ReadingEventType" AS ENUM('START', 'PROGRESS', 'FINISH');--> statement-breakpoint
CREATE TYPE "public"."ReferenceType" AS ENUM('AUTHOR', 'GENRE', 'TRANSLATOR', 'PUBLISHER', 'COUNTRY');--> statement-breakpoint
CREATE TYPE "public"."StaticPageStatus" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."VerificationCodePurpose" AS ENUM('email_verification', 'login', 'password_reset');--> statement-breakpoint
ALTER TYPE "public"."BookStatus" ADD VALUE 'PAUSED' BEFORE 'FINISHED';--> statement-breakpoint
CREATE TABLE "BlogCategory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "BlogCategory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "BlogPost" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category_id" varchar,
	"excerpt" text,
	"content" text NOT NULL,
	"banner_image" text NOT NULL,
	"status" "BlogPostStatus" DEFAULT 'DRAFT' NOT NULL,
	"created_by_id" varchar,
	"published_at" timestamp,
	"reading_time" integer,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "BlogPost_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "BookEdition" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_book_id" varchar NOT NULL,
	"title_override" text,
	"translator" text,
	"publisher" text,
	"isbn" varchar(20),
	"isbn10" varchar(20),
	"isbn13" varchar(20),
	"format" "BookFormat" DEFAULT 'PHYSICAL' NOT NULL,
	"cover_image" text,
	"cover_filename" text,
	"published_year" integer,
	"edition_label" text,
	"edition_description" text,
	"page_count" integer,
	"language" varchar(50),
	"source_name" text,
	"source_url" text,
	"source_edition_code" text,
	"status" "ApprovalStatus" DEFAULT 'APPROVED' NOT NULL,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BookEditionContributor" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_edition_id" varchar NOT NULL,
	"reference_item_id" varchar NOT NULL,
	"role" "CatalogBookContributorRole" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_name" text,
	"source_url" text,
	CONSTRAINT "BookEditionContributor_unique" UNIQUE("book_edition_id","reference_item_id","role")
);
--> statement-breakpoint
CREATE TABLE "BookEditionPublisher" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_edition_id" varchar NOT NULL,
	"reference_item_id" varchar NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_name" text,
	"source_url" text,
	CONSTRAINT "BookEditionPublisher_unique" UNIQUE("book_edition_id","reference_item_id")
);
--> statement-breakpoint
CREATE TABLE "BookExternalLink" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_book_id" varchar NOT NULL,
	"edition_id" varchar,
	"provider" "ExternalLinkProvider" NOT NULL,
	"label" text,
	"url" text NOT NULL,
	"type" "ExternalLinkType" DEFAULT 'unknown' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "BookExternalLink_catalog_provider_url_unique" UNIQUE("catalog_book_id","provider","url")
);
--> statement-breakpoint
CREATE TABLE "CatalogBook" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"slug" text,
	"original_title" text,
	"description" text,
	"cover_image" text,
	"author" text NOT NULL,
	"language" varchar(50),
	"genre" text,
	"country" text,
	"first_published_year" integer,
	"source_name" text,
	"source_url" text,
	"status" "ApprovalStatus" DEFAULT 'APPROVED' NOT NULL,
	"primary_edition_id" varchar,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "CatalogBook_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "CatalogBookContributor" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_book_id" varchar NOT NULL,
	"reference_item_id" varchar NOT NULL,
	"role" "CatalogBookContributorRole" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_name" text,
	"source_url" text,
	CONSTRAINT "CatalogBookContributor_unique" UNIQUE("catalog_book_id","reference_item_id","role")
);
--> statement-breakpoint
CREATE TABLE "HomeFeaturedBook" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_book_id" varchar,
	"book_id" varchar,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "HomeFeaturedBook_catalog_book_id_unique" UNIQUE("catalog_book_id"),
	CONSTRAINT "HomeFeaturedBook_book_id_unique" UNIQUE("book_id")
);
--> statement-breakpoint
CREATE TABLE "HomeHeroSlide" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"badge" text,
	"primary_cta_label" text,
	"primary_cta_href" text,
	"secondary_cta_label" text,
	"secondary_cta_href" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "HomeHeroSlideBook" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slide_id" varchar NOT NULL,
	"catalog_book_id" varchar,
	"book_id" varchar,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "IranKetabImportEvent" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"type" "IranKetabImportEventType" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "IranKetabImportSession" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"source_url" text NOT NULL,
	"canonical_source_url" text NOT NULL,
	"source_name" text DEFAULT 'iranketab' NOT NULL,
	"status" "IranKetabImportStatus" DEFAULT 'CREATED' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"draft_version" integer DEFAULT 1 NOT NULL,
	"catalog_id" varchar,
	"draft" jsonb,
	"extraction" jsonb,
	"extraction_fingerprint" text,
	"prepared_covers" jsonb,
	"result_summary" jsonb,
	"error_code" text,
	"error_message" text,
	"retryable" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "IranKetabPreviewOperation" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_identity" text NOT NULL,
	"status" "IranKetabPreviewOperationStatus" DEFAULT 'PROCESSING' NOT NULL,
	"lease_expires_at" timestamp,
	"expires_at" timestamp,
	"result" jsonb,
	"error_code" text,
	"error_message" text,
	"retryable" boolean DEFAULT false NOT NULL,
	"generation" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "IranKetabPreviewOperation_source_identity_unique" UNIQUE("source_identity")
);
--> statement-breakpoint
CREATE TABLE "PasswordResetToken" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PasswordResetToken_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "PersonalBookNote" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"page_number" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PublicBookThought" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_book_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"source_personal_note_id" varchar,
	"content" text NOT NULL,
	"page_number" integer,
	"type" "PublicBookThoughtType" DEFAULT 'THOUGHT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PublishedBookNote" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"book_id" varchar,
	"catalog_book_id" varchar,
	"book_edition_id" varchar,
	"scope" "NoteScope" DEFAULT 'book' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PublishedBookNote_content_length_check" CHECK (char_length("PublishedBookNote"."content") <= 50000)
);
--> statement-breakpoint
CREATE TABLE "PublishedBookNoteLike" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PublishedBookNoteLike_note_user_unique" UNIQUE("note_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "QuoteLike" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "QuoteLike_quote_user_unique" UNIQUE("quote_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "ReadingEvent" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"book_id" varchar NOT NULL,
	"type" "ReadingEventType" NOT NULL,
	"page_from" integer,
	"page_to" integer,
	"pages_read" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ReferenceItem" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "ReferenceType" NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"cover_image" text,
	"banner_image" text,
	"original_name" text,
	"description" text,
	"short_description" text,
	"image_filename" text,
	"source_name" text,
	"source_url" text,
	"seo_title" text,
	"seo_description" text,
	"metadata" jsonb,
	"birth_year" integer,
	"death_year" integer,
	"country_name" text,
	"country_slug" text,
	"website" text,
	"status" "ApprovalStatus" DEFAULT 'PENDING' NOT NULL,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ReferenceItem_type_slug_unique" UNIQUE("type","slug")
);
--> statement-breakpoint
CREATE TABLE "SiteSetting" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StaticPage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"content" text DEFAULT '' NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"status" "StaticPageStatus" DEFAULT 'PUBLISHED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "StaticPage_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "VerificationCode" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" text NOT NULL,
	"purpose" "VerificationCodePurpose" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Wishlist" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"translator" text,
	"publisher" text,
	"genre" text,
	"note" text,
	"priority" "PurchasePriority" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Book" ALTER COLUMN "cover_image" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN "current_page" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN "reading_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN "mood_tags" text[];--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN "catalog_book_id" varchar;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN "edition_id" varchar;--> statement-breakpoint
ALTER TABLE "Quote" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "Quote" ADD COLUMN "image_key" text;--> statement-breakpoint
ALTER TABLE "Quote" ADD COLUMN "background" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "Quote" ADD COLUMN "catalog_book_id" varchar;--> statement-breakpoint
ALTER TABLE "Quote" ADD COLUMN "book_edition_id" varchar;--> statement-breakpoint
ALTER TABLE "Quote" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Quote" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "profile_banner_image" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "auth_provider" "AuthProvider" DEFAULT 'password' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "username" varchar(30);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "bio" varchar(500);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "location" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "instagram" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "twitter" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "linkedin" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "telegram" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "profile_visibility" "ProfileVisibility" DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "role" "UserRole" DEFAULT 'USER' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_category_id_BlogCategory_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."BlogCategory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BookEdition" ADD CONSTRAINT "BookEdition_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BookEdition" ADD CONSTRAINT "BookEdition_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BookEditionContributor" ADD CONSTRAINT "BookEditionContributor_book_edition_id_BookEdition_id_fk" FOREIGN KEY ("book_edition_id") REFERENCES "public"."BookEdition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BookEditionContributor" ADD CONSTRAINT "BookEditionContributor_reference_item_id_ReferenceItem_id_fk" FOREIGN KEY ("reference_item_id") REFERENCES "public"."ReferenceItem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BookEditionPublisher" ADD CONSTRAINT "BookEditionPublisher_book_edition_id_BookEdition_id_fk" FOREIGN KEY ("book_edition_id") REFERENCES "public"."BookEdition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BookEditionPublisher" ADD CONSTRAINT "BookEditionPublisher_reference_item_id_ReferenceItem_id_fk" FOREIGN KEY ("reference_item_id") REFERENCES "public"."ReferenceItem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BookExternalLink" ADD CONSTRAINT "BookExternalLink_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BookExternalLink" ADD CONSTRAINT "BookExternalLink_edition_id_BookEdition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."BookEdition"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CatalogBook" ADD CONSTRAINT "CatalogBook_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CatalogBookContributor" ADD CONSTRAINT "CatalogBookContributor_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CatalogBookContributor" ADD CONSTRAINT "CatalogBookContributor_reference_item_id_ReferenceItem_id_fk" FOREIGN KEY ("reference_item_id") REFERENCES "public"."ReferenceItem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "HomeFeaturedBook" ADD CONSTRAINT "HomeFeaturedBook_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "HomeFeaturedBook" ADD CONSTRAINT "HomeFeaturedBook_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."Book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "HomeHeroSlideBook" ADD CONSTRAINT "HomeHeroSlideBook_slide_id_HomeHeroSlide_id_fk" FOREIGN KEY ("slide_id") REFERENCES "public"."HomeHeroSlide"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "HomeHeroSlideBook" ADD CONSTRAINT "HomeHeroSlideBook_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "HomeHeroSlideBook" ADD CONSTRAINT "HomeHeroSlideBook_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."Book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "IranKetabImportEvent" ADD CONSTRAINT "IranKetabImportEvent_session_id_IranKetabImportSession_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."IranKetabImportSession"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "IranKetabImportSession" ADD CONSTRAINT "IranKetabImportSession_admin_id_User_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "IranKetabImportSession" ADD CONSTRAINT "IranKetabImportSession_catalog_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."CatalogBook"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PersonalBookNote" ADD CONSTRAINT "PersonalBookNote_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."Book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PersonalBookNote" ADD CONSTRAINT "PersonalBookNote_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublicBookThought" ADD CONSTRAINT "PublicBookThought_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublicBookThought" ADD CONSTRAINT "PublicBookThought_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublicBookThought" ADD CONSTRAINT "PublicBookThought_source_personal_note_id_PersonalBookNote_id_fk" FOREIGN KEY ("source_personal_note_id") REFERENCES "public"."PersonalBookNote"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublishedBookNote" ADD CONSTRAINT "PublishedBookNote_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublishedBookNote" ADD CONSTRAINT "PublishedBookNote_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."Book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublishedBookNote" ADD CONSTRAINT "PublishedBookNote_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublishedBookNote" ADD CONSTRAINT "PublishedBookNote_book_edition_id_BookEdition_id_fk" FOREIGN KEY ("book_edition_id") REFERENCES "public"."BookEdition"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublishedBookNoteLike" ADD CONSTRAINT "PublishedBookNoteLike_note_id_PublishedBookNote_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."PublishedBookNote"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PublishedBookNoteLike" ADD CONSTRAINT "PublishedBookNoteLike_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuoteLike" ADD CONSTRAINT "QuoteLike_quote_id_Quote_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."Quote"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuoteLike" ADD CONSTRAINT "QuoteLike_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ReadingEvent" ADD CONSTRAINT "ReadingEvent_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ReadingEvent" ADD CONSTRAINT "ReadingEvent_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."Book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ReferenceItem" ADD CONSTRAINT "ReferenceItem_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "BookEditionContributor_edition_idx" ON "BookEditionContributor" USING btree ("book_edition_id");--> statement-breakpoint
CREATE INDEX "BookEditionContributor_reference_idx" ON "BookEditionContributor" USING btree ("reference_item_id");--> statement-breakpoint
CREATE INDEX "BookEditionPublisher_edition_idx" ON "BookEditionPublisher" USING btree ("book_edition_id");--> statement-breakpoint
CREATE INDEX "BookEditionPublisher_reference_idx" ON "BookEditionPublisher" USING btree ("reference_item_id");--> statement-breakpoint
CREATE INDEX "BookExternalLink_catalog_idx" ON "BookExternalLink" USING btree ("catalog_book_id");--> statement-breakpoint
CREATE INDEX "BookExternalLink_provider_idx" ON "BookExternalLink" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "BookExternalLink_active_idx" ON "BookExternalLink" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "CatalogBookContributor_catalog_idx" ON "CatalogBookContributor" USING btree ("catalog_book_id");--> statement-breakpoint
CREATE INDEX "CatalogBookContributor_reference_idx" ON "CatalogBookContributor" USING btree ("reference_item_id");--> statement-breakpoint
CREATE INDEX "IranKetabImportEvent_session_idx" ON "IranKetabImportEvent" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IranKetabImportEvent_created_idx" ON "IranKetabImportEvent" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IranKetabImportEvent_type_idx" ON "IranKetabImportEvent" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IranKetabImportSession_admin_idx" ON "IranKetabImportSession" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "IranKetabImportSession_status_idx" ON "IranKetabImportSession" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IranKetabImportSession_created_idx" ON "IranKetabImportSession" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IranKetabImportSession_canonical_idx" ON "IranKetabImportSession" USING btree ("canonical_source_url");--> statement-breakpoint
CREATE INDEX "IranKetabPreviewOperation_reclaim_idx" ON "IranKetabPreviewOperation" USING btree ("status","lease_expires_at","expires_at");--> statement-breakpoint
CREATE INDEX "PersonalBookNote_book_user_idx" ON "PersonalBookNote" USING btree ("book_id","user_id");--> statement-breakpoint
CREATE INDEX "PersonalBookNote_created_at_idx" ON "PersonalBookNote" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "PublicBookThought_source_note_unique" ON "PublicBookThought" USING btree ("source_personal_note_id");--> statement-breakpoint
CREATE INDEX "PublicBookThought_book_created_idx" ON "PublicBookThought" USING btree ("catalog_book_id","created_at");--> statement-breakpoint
CREATE INDEX "PublicBookThought_user_idx" ON "PublicBookThought" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "PublishedBookNote_user_id_idx" ON "PublishedBookNote" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "PublishedBookNote_book_id_idx" ON "PublishedBookNote" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "PublishedBookNote_created_at_idx" ON "PublishedBookNote" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "PublishedBookNote_updated_at_idx" ON "PublishedBookNote" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "ReadingEvent_user_book_created_idx" ON "ReadingEvent" USING btree ("user_id","book_id","created_at");--> statement-breakpoint
CREATE INDEX "VerificationCode_email_purpose_idx" ON "VerificationCode" USING btree ("email","purpose");--> statement-breakpoint
CREATE INDEX "VerificationCode_expires_at_idx" ON "VerificationCode" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "Book" ADD CONSTRAINT "Book_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Book" ADD CONSTRAINT "Book_edition_id_BookEdition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."BookEdition"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_book_edition_id_BookEdition_id_fk" FOREIGN KEY ("book_edition_id") REFERENCES "public"."BookEdition"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "Quote_image_key_unique" ON "Quote" USING btree ("image_key");--> statement-breakpoint
CREATE INDEX "Quote_book_id_idx" ON "Quote" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "Quote_user_id_idx" ON "Quote" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "Quote_created_at_idx" ON "Quote" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "Quote_updated_at_idx" ON "Quote" USING btree ("updated_at");--> statement-breakpoint
ALTER TABLE "Book" ADD CONSTRAINT "Book_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_google_id_unique" UNIQUE("google_id");--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_username_unique" UNIQUE("username");