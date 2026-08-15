CREATE TABLE IF NOT EXISTS "BlogPostBook" (
  "post_id" varchar NOT NULL REFERENCES "BlogPost"("id") ON DELETE CASCADE,
  "book_id" varchar NOT NULL REFERENCES "CatalogBook"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "BlogPostBook_unique" UNIQUE("post_id", "book_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BlogPostBook_post_idx" ON "BlogPostBook" ("post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BlogPostBook_book_idx" ON "BlogPostBook" ("book_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "BlogPostAuthor" (
  "post_id" varchar NOT NULL REFERENCES "BlogPost"("id") ON DELETE CASCADE,
  "author_id" varchar NOT NULL REFERENCES "ReferenceItem"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "BlogPostAuthor_unique" UNIQUE("post_id", "author_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BlogPostAuthor_post_idx" ON "BlogPostAuthor" ("post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BlogPostAuthor_author_idx" ON "BlogPostAuthor" ("author_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "BlogPostGenre" (
  "post_id" varchar NOT NULL REFERENCES "BlogPost"("id") ON DELETE CASCADE,
  "genre_id" varchar NOT NULL REFERENCES "ReferenceItem"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "BlogPostGenre_unique" UNIQUE("post_id", "genre_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BlogPostGenre_post_idx" ON "BlogPostGenre" ("post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BlogPostGenre_genre_idx" ON "BlogPostGenre" ("genre_id");
