CREATE TABLE "AnalyticsPageView" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "visitor_id" varchar(64) NOT NULL,
  "user_id" varchar,
  "path" varchar(500) NOT NULL,
  "content_kind" varchar(32),
  "content_slug" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "AnalyticsPageView" ADD CONSTRAINT "AnalyticsPageView_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "AnalyticsPageView_created_at_idx" ON "AnalyticsPageView" USING btree ("created_at");
CREATE INDEX "AnalyticsPageView_visitor_created_idx" ON "AnalyticsPageView" USING btree ("visitor_id", "created_at");
CREATE INDEX "AnalyticsPageView_content_created_idx" ON "AnalyticsPageView" USING btree ("content_kind", "content_slug", "created_at");
CREATE INDEX "AnalyticsPageView_user_created_idx" ON "AnalyticsPageView" USING btree ("user_id", "created_at");
