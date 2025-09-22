"use client";

import { useState, useEffect } from "react";
import BooksChart from "@/components/BooksChart";
import BooksTable from "@/components/BooksTable";
import { PageLoading } from "@/components/Loading";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Star,
  TrendingUp,
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
  progress?: number | null;
  rating?: number | null;
  createdAt: string;
}

export default function AccountPage() {
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [books, setBooks] = useState<BookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [statsRes, booksRes] = await Promise.all([
          fetch("/api/account/stats", { credentials: "include" }),
          fetch("/api/books", { credentials: "include" }),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
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

  const totalPagesReadFromBooks = books.reduce((acc, b) => {
    const pageCount = b.pageCount ?? 0;
    const prog = b.progress;
    let pagesReadForBook = 0;

    if (typeof prog === "number") {
      pagesReadForBook = Math.round(pageCount * (prog / 100));
    } else if (b.status?.toUpperCase() === "FINISHED") {
      pagesReadForBook = pageCount;
    }

    return acc + pagesReadForBook;
  }, 0);

  if (isLoading) {
    return <PageLoading text="در حال بارگذاری آمار..." />;
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-gray-400">خطا در بارگذاری آمار</div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
          داشبورد حساب کاربری
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          آمار و اطلاعات کتابخانه شخصی شما
        </p>
      </div>

      {/* Overview in one card */}
      <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4 text-white">نمای کلی</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            {
              label: "کل کتاب‌ها",
              value: stats.overview.totalBooks,
              icon: BookOpen,
            },
            {
              label: "تمام شده",
              value: stats.overview.finishedBooks,
              icon: CheckCircle,
            },
            {
              label: "در حال خواندن",
              value: stats.overview.readingBooks,
              icon: Clock,
            },
            {
              label: "خوانده نشده",
              value: stats.overview.unreadBooks,
              icon: Eye,
            },
            {
              label: "صفحات خوانده شده",
              value: totalPagesReadFromBooks,
              icon: TrendingUp,
            },
            {
              label: "لیست خرید",
              value: stats.overview.totalWishlist,
              icon: Heart,
            },
            {
              label: "میانگین امتیاز",
              value: stats.overview.avgRating,
              icon: Star,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700"
            >
              <item.icon className="text-[#00FF99] shrink-0" />
              <div>
                <div className="text-base font-bold text-white">
                  {item.value}
                </div>
                <div className="text-xs text-gray-400">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BooksChart
          data={stats.breakdowns.byStatus}
          title="توزیع بر اساس وضعیت"
          type="bar"
          className="w-full"
        />
        <BooksChart
          data={stats.breakdowns.byGenre.slice(0, 8)}
          title="برترین ژانرها"
          type="bar"
          className="w-full"
        />
      </div>

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
        className="h-80 w-full"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BooksChart
          data={stats.breakdowns.byPublisher.slice(0, 6)}
          title="برترین ناشران"
          type="bar"
          className="h-80 w-full"
        />
        <BooksChart
          data={stats.breakdowns.byCountry.slice(0, 6)}
          title="توزیع بر اساس کشور"
          type="bar"
          className="h-80 w-full"
        />
      </div>

      {/* Books Table */}
      <div className="overflow-x-auto">
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
      </div>

      {stats.breakdowns.byRating.length > 0 && (
        <BooksChart
          data={stats.breakdowns.byRating}
          title="توزیع امتیازها"
          type="bar"
          className="h-80 w-full"
        />
      )}
    </div>
  );
}
