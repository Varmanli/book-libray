CREATE TABLE IF NOT EXISTS "QuoteBackground" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"image_key" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "QuoteBackground_value_unique" UNIQUE("value")
);

CREATE INDEX IF NOT EXISTS "QuoteBackground_display_order_idx" ON "QuoteBackground" USING btree ("display_order");
CREATE INDEX IF NOT EXISTS "QuoteBackground_is_active_idx" ON "QuoteBackground" USING btree ("is_active");

INSERT INTO "QuoteBackground" ("id", "value", "label", "image_key", "image_url", "is_active", "display_order", "is_system")
VALUES
  (gen_random_uuid(), 'default', 'پیش‌فرض', NULL, NULL, true, 0, true),
  (gen_random_uuid(), 'bg-1', 'طرح ۱', NULL, '/quotebg/bg-1.webp', true, 1, true),
  (gen_random_uuid(), 'bg-2', 'طرح ۲', NULL, '/quotebg/bg-2.webp', true, 2, true),
  (gen_random_uuid(), 'bg-3', 'طرح ۳', NULL, '/quotebg/bg-3.webp', true, 3, true),
  (gen_random_uuid(), 'bg-4', 'طرح ۴', NULL, '/quotebg/bg-4.webp', true, 4, true),
  (gen_random_uuid(), 'bg-5', 'طرح ۵', NULL, '/quotebg/bg-5.webp', true, 5, true),
  (gen_random_uuid(), 'bg-6', 'طرح ۶', NULL, '/quotebg/bg-6.webp', true, 6, true),
  (gen_random_uuid(), 'bg-7', 'طرح ۷', NULL, '/quotebg/bg-7.webp', true, 7, true),
  (gen_random_uuid(), 'bg-8', 'طرح ۸', NULL, '/quotebg/bg-8.webp', true, 8, true),
  (gen_random_uuid(), 'bg-9', 'طرح ۹', NULL, '/quotebg/bg-9.webp', true, 9, true),
  (gen_random_uuid(), 'bg-10', 'طرح ۱۰', NULL, '/quotebg/bg-10.webp', true, 10, true),
  (gen_random_uuid(), 'bg-11', 'طرح ۱۱', NULL, '/quotebg/bg-11.webp', true, 11, true),
  (gen_random_uuid(), 'bg-12', 'طرح ۱۲', NULL, '/quotebg/bg-12.webp', true, 12, true)
ON CONFLICT ("value") DO NOTHING;
