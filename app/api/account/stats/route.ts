import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Book, Wishlist } from "@/db/schema";
import jwt from "jsonwebtoken";
import { eq, sql, count, sum, and } from "drizzle-orm";

// 📌 استخراج و اعتبارسنجی توکن
function extractAndValidateToken(
  req: NextRequest
): { userId: string } | { error: string; status: number } {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return { error: "توکن لاگین نیاز است", status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    return { userId: decoded.id };
  } catch {
    return { error: "توکن نامعتبر است", status: 401 };
  }
}

// 📌 دریافت آمار کاربر
export async function GET(req: NextRequest) {
  try {
    // اعتبارسنجی توکن
    const tokenValidation = extractAndValidateToken(req);
    if ("error" in tokenValidation) {
      return NextResponse.json(
        { error: tokenValidation.error },
        { status: tokenValidation.status }
      );
    }
    const { userId } = tokenValidation;

    // آمار کلی کتاب‌ها
    const [bookStats] = await db
      .select({
        totalBooks: count(Book.id),
        totalPages: sum(Book.pageCount),
        finishedBooks: sql<number>`count(case when ${Book.status} = 'FINISHED' then 1 end)`,
        readingBooks: sql<number>`count(case when ${Book.status} = 'READING' then 1 end)`,
        unreadBooks: sql<number>`count(case when ${Book.status} = 'UNREAD' then 1 end)`,
      })
      .from(Book)
      .where(eq(Book.userId, userId));

    // آمار Wishlist
    const [wishlistStats] = await db
      .select({
        totalWishlist: count(Wishlist.id),
      })
      .from(Wishlist)
      .where(eq(Wishlist.userId, userId));

    // آمار بر اساس ناشر
    const publisherStats = await db
      .select({
        publisher: Book.publisher,
        count: count(Book.id),
      })
      .from(Book)
      .where(and(eq(Book.userId, userId), sql`${Book.publisher} IS NOT NULL`))
      .groupBy(Book.publisher)
      .orderBy(sql`count(${Book.id}) DESC`)
      .limit(10);

    // آمار بر اساس نویسنده
    const authorStats = await db
      .select({
        author: Book.author,
        count: count(Book.id),
      })
      .from(Book)
      .where(eq(Book.userId, userId))
      .groupBy(Book.author)
      .orderBy(sql`count(${Book.id}) DESC`)
      .limit(10);

    // آمار بر اساس کشور
    const countryStats = await db
      .select({
        country: Book.country,
        count: count(Book.id),
      })
      .from(Book)
      .where(and(eq(Book.userId, userId), sql`${Book.country} IS NOT NULL`))
      .groupBy(Book.country)
      .orderBy(sql`count(${Book.id}) DESC`)
      .limit(10);

    // آمار بر اساس ژانر
    const genreStats = await db
      .select({
        genre: Book.genre,
        count: count(Book.id),
      })
      .from(Book)
      .where(eq(Book.userId, userId))
      .groupBy(Book.genre)
      .orderBy(sql`count(${Book.id}) DESC`)
      .limit(10);

    // آمار وضعیت کتاب‌ها
    const statusStats = await db
      .select({
        status: Book.status,
        count: count(Book.id),
      })
      .from(Book)
      .where(eq(Book.userId, userId))
      .groupBy(Book.status);

    // آمار فرمت کتاب‌ها
    const formatStats = await db
      .select({
        format: Book.format,
        count: count(Book.id),
      })
      .from(Book)
      .where(eq(Book.userId, userId))
      .groupBy(Book.format);

    // آمار ماهانه کتاب‌های اضافه شده (آخرین 12 ماه)
    const monthlyStats = await db
      .select({
        month: sql<string>`to_char(${Book.createdAt}, 'YYYY-MM')`,
        count: count(Book.id),
      })
      .from(Book)
      .where(
        and(
          eq(Book.userId, userId),
          sql`${Book.createdAt} >= NOW() - INTERVAL '12 months'`
        )
      )
      .groupBy(sql`to_char(${Book.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${Book.createdAt}, 'YYYY-MM')`);

    // آمار امتیازدهی
    const ratingStats = await db
      .select({
        rating: Book.rating,
        count: count(Book.id),
      })
      .from(Book)
      .where(and(eq(Book.userId, userId), sql`${Book.rating} IS NOT NULL`))
      .groupBy(Book.rating)
      .orderBy(Book.rating);

    // محاسبه میانگین امتیاز
    const [avgRating] = await db
      .select({
        avgRating: sql<number>`AVG(${Book.rating})`,
      })
      .from(Book)
      .where(and(eq(Book.userId, userId), sql`${Book.rating} IS NOT NULL`));

    // آمار صفحات خوانده شده
    const [readingProgress] = await db
      .select({
        totalProgress: sql<number>`SUM((${Book.progress} * ${Book.pageCount}) / 100)`,
        avgProgress: sql<number>`AVG(${Book.progress})`,
      })
      .from(Book)
      .where(
        and(
          eq(Book.userId, userId),
          sql`${Book.progress} IS NOT NULL AND ${Book.progress} > 0`
        )
      );

    return NextResponse.json({
      overview: {
        totalBooks: bookStats.totalBooks || 0,
        totalPages: bookStats.totalPages || 0,
        totalPagesRead: Math.round(readingProgress.totalProgress || 0),
        finishedBooks: bookStats.finishedBooks || 0,
        readingBooks: bookStats.readingBooks || 0,
        unreadBooks: bookStats.unreadBooks || 0,
        totalWishlist: wishlistStats.totalWishlist || 0,
        avgRating: avgRating.avgRating
          ? Math.round(avgRating.avgRating * 10) / 10
          : 0,
        avgProgress: readingProgress.avgProgress
          ? Math.round(readingProgress.avgProgress)
          : 0,
      },
      breakdowns: {
        byPublisher: publisherStats.map((stat) => ({
          name: stat.publisher || "نامشخص",
          value: stat.count,
        })),
        byAuthor: authorStats.map((stat) => ({
          name: stat.author,
          value: stat.count,
        })),
        byCountry: countryStats.map((stat) => ({
          name: stat.country || "نامشخص",
          value: stat.count,
        })),
        byGenre: genreStats.map((stat) => ({
          name: stat.genre,
          value: stat.count,
        })),
        byStatus: statusStats.map((stat) => ({
          name:
            stat.status === "FINISHED"
              ? "تمام شده"
              : stat.status === "READING"
              ? "در حال خواندن"
              : "خوانده نشده",
          value: stat.count,
        })),
        byFormat: formatStats.map((stat) => ({
          name: stat.format === "PHYSICAL" ? "فیزیکی" : "الکترونیکی",
          value: stat.count,
        })),
        byRating: ratingStats.map((stat) => ({
          name: `${stat.rating} ستاره`,
          value: stat.count,
        })),
      },
      trends: {
        monthly: monthlyStats.map((stat) => ({
          name: stat.month,
          value: stat.count,
        })),
      },
    });
  } catch (err) {
    console.error("❌ خطا در دریافت آمار:", err);
    return NextResponse.json({ error: "خطا در دریافت آمار" }, { status: 500 });
  }
}
