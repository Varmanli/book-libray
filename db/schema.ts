import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------- Enums ----------------
export const BookFormat = pgEnum("BookFormat", ["PHYSICAL", "ELECTRONIC"]);
export const BookStatus = pgEnum("BookStatus", [
  "UNREAD",
  "READING",
  "FINISHED",
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
  password: text("password"),
});

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

// ---------------- Book ----------------
export const Book = pgTable("Book", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  title: text("title").notNull(),
  coverImage: text("cover_image").notNull(),
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
});

// ---------------- Quote ----------------
export const Quote = pgTable("Quote", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  page: integer("page"),
  bookId: varchar("book_id")
    .notNull()
    .references(() => Book.id, { onDelete: "cascade" }),
});

// ---------------- Relations ----------------
export const UserRelations = relations(User, ({ many }) => ({
  accounts: many(Account),
  books: many(Book),
  sessions: many(Session),
}));

export const BookRelations = relations(Book, ({ one, many }) => ({
  user: one(User, { fields: [Book.userId], references: [User.id] }),
  quotes: many(Quote),
}));

export const QuoteRelations = relations(Quote, ({ one }) => ({
  book: one(Book, { fields: [Quote.bookId], references: [Book.id] }),
}));

export const AccountRelations = relations(Account, ({ one }) => ({
  user: one(User, { fields: [Account.userId], references: [User.id] }),
}));
