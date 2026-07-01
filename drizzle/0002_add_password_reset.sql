-- افزودن ستون‌های زمانی به جدول User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint

-- جدول توکن‌های بازیابی رمز عبور (فقط هش توکن ذخیره می‌شود)
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PasswordResetToken_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint

-- کلید خارجی به User با حذف آبشاری
DO $$ BEGIN
	ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
