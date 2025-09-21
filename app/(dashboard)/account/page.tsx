"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/StatsCard";
import BooksChart from "@/components/BooksChart";
import BooksTable from "@/components/BooksTable";
import { PageLoading, ChartLoading } from "@/components/Loading";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Star,
  TrendingUp,
  BarChart3,
  Globe,
  User,
  Building,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

interface AccountStats {
  overview: {
    totalBooks: number;
    totalPages: number;
    totalPagesRead: number;
    finishedBooks: number;
    readingBooks: number;
    unreadBooks: number;
    totalWishlist: number;
    avgRating: number;
    avgProgress: number;
  };
  breakdowns: {
    byPublisher: { name: string; value: number }[];
    byAuthor: { name: string; value: number }[];
    byCountry: { name: string; value: number }[];
    byGenre: { name: string; value: number }[];
    byStatus: { name: string; value: number }[];
    byFormat: { name: string; value: number }[];
    byRating: { name: string; value: number }[];
  };
  trends: {
    monthly: { name: string; value: number }[];
  };
}

interface BookData {
  id: string;
  title: string;
  author: string;
  publisher?: string | null;
  genre?: string | null;
  country?: string | null;
  status?: string;
  pageCount?: number | null;
  progress?: number | null; // درصد (0-100) یا null
  rating?: number | null;
  createdAt: string;
}

export default function AccountPage() {
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [books, setBooks] = useState<BookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // بارگذاری موازی دو API و صبر تا اتمام هر دو
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [statsRes, booksRes] = await Promise.all([
          fetch("/api/account/stats", { credentials: "include" }),
          fetch("/api/books", { credentials: "include" }),
        ]);

        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          setStats(statsJson);
        } else {
          toast.error("خطا در دریافت آمار");
          setStats(null);
        }

        if (booksRes.ok) {
          const booksJson = await booksRes.json();
          setBooks(booksJson.Book || []);
        } else {
          toast.error("خطا در دریافت کتاب‌ها");
          setBooks([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("خطا در دریافت داده‌ها");
        setStats(null);
        setBooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  // محاسبه مجموع صفحات خوانده‌شده بر اساس داده‌های books (تبدیل logic):
  // اگر progress عدد هست -> pageCount * progress/100
  // در غیر این صورت، اگر status === 'FINISHED' فرض می‌کنیم کل صفحات خوانده شده
  const totalPagesReadFromBooks = books.reduce((acc, b) => {
    const pageCount = b.pageCount ?? 0;
    const prog = b.progress;
    let pagesReadForBook = 0;

    if (typeof prog === "number") {
      pagesReadForBook = Math.round(pageCount * (prog / 100));
    } else if (b.status && b.status.toString().toUpperCase() === "FINISHED") {
      pagesReadForBook = pageCount;
    } else {
      pagesReadForBook = 0;
    }

    return acc + pagesReadForBook;
  }, 0);

  if (isLoading) {
    return <PageLoading text="در حال بارگذاری آمار..." />;
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">
          <p>خطا در بارگذاری آمار</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          داشبورد حساب کاربری
        </h1>
        <p className="text-gray-400">آمار و اطلاعات کتابخانه شخصی شما</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="کل کتاب‌ها"
          value={stats.overview.totalBooks}
          icon={BookOpen}
          description="تعداد کل کتاب‌های موجود"
        />
        <StatsCard
          title="کتاب‌های تمام شده"
          value={stats.overview.finishedBooks}
          icon={CheckCircle}
          description="کتاب‌هایی که خوانده‌اید"
        />
        <StatsCard
          title="در حال خواندن"
          value={stats.overview.readingBooks}
          icon={Clock}
          description="کتاب‌های در حال مطالعه"
        />
        <StatsCard
          title="خوانده نشده"
          value={stats.overview.unreadBooks}
          icon={Eye}
          description="کتاب‌های هنوز نخوانده"
        />
        {/* ← این کارت اکنون مقدارش از محاسبه محلی گرفته می‌شود */}
        <StatsCard
          title="صفحات خوانده شده"
          value={totalPagesReadFromBooks}
          icon={TrendingUp}
          description="مجموع صفحات مطالعه شده"
        />
        <StatsCard
          title="لیست خرید"
          value={stats.overview.totalWishlist}
          icon={Heart}
          description="کتاب‌های مورد علاقه"
        />
        <StatsCard
          title="میانگین امتیاز"
          value={stats.overview.avgRating}
          icon={Star}
          description="امتیاز متوسط کتاب‌ها"
        />
      </div>

      {/* Charts Section */}
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BooksChart
          data={stats.breakdowns.byStatus}
          title="توزیع بر اساس وضعیت"
          type="pie"
          className="h-96"
        />
        <BooksChart
          data={stats.breakdowns.byGenre.slice(0, 8)}
          title="برترین ژانرها"
          type="bar"
          className="h-96"
        />
      </div>

      {/* نویسندگان تمام عرض */}
      <div className="mb-8">
        <BooksChart
          data={stats.breakdowns.byAuthor.slice(0, 8).map((item) => {
            const lastSpaceIndex = item.name.lastIndexOf(" ");
            return {
              ...item,
              name:
                lastSpaceIndex !== -1
                  ? item.name.slice(lastSpaceIndex + 1)
                  : item.name,
            };
          })}
          title="برترین نویسندگان"
          type="bar"
          className="h-96"
        />
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BooksChart
          data={stats.breakdowns.byPublisher.slice(0, 6)}
          title="برترین ناشران"
          type="bar"
          className="h-96"
        />
        <BooksChart
          data={stats.breakdowns.byCountry.slice(0, 6)}
          title="توزیع بر اساس کشور"
          type="bar"
          className="h-96"
        />
      </div>

      {/* Books Table */}
      <BooksTable
        data={books}
        title="جدول کتاب‌ها"
        searchPlaceholder="جستجو در کتاب‌ها..."
        filterOptions={[
          { value: "FINISHED", label: "تمام شده" },
          { value: "READING", label: "در حال خواندن" },
          { value: "UNREAD", label: "خوانده نشده" },
        ]}
      />

      {/* Rating Distribution */}
      {stats.breakdowns.byRating.length > 0 && (
        <div className="mt-8">
          <BooksChart
            data={stats.breakdowns.byRating}
            title="توزیع امتیازها"
            type="bar"
            className="h-96"
          />
        </div>
      )}
    </div>
  );
}
