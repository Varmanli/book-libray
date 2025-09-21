"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Home,
  Search,
  ArrowRight,
  Heart,
  BarChart3,
  Plus,
  RotateCcw,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Main Error Card */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8 md:p-12">
            {/* Book Icon Animation */}
            <div className="relative mb-8">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-[#00FF99]/10 rounded-3xl animate-pulse"></div>
                <div className="absolute inset-2 bg-[#00FF99]/20 rounded-2xl animate-bounce"></div>
                <BookOpen className="absolute inset-0 w-full h-full text-[#00FF99] p-6 animate-pulse" />
              </div>

              {/* Floating Books */}
              <div className="absolute -top-4 -left-8 w-8 h-12 bg-orange-500/20 rounded rotate-12 animate-float"></div>
              <div className="absolute -top-2 -right-6 w-6 h-10 bg-blue-500/20 rounded -rotate-12 animate-float-delayed"></div>
              <div className="absolute -bottom-2 -left-4 w-7 h-11 bg-green-500/20 rounded rotate-6 animate-float-slow"></div>
            </div>

            {/* Error Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-6xl md:text-8xl font-bold text-[#00FF99]">
                  404
                </h1>
                <h2 className="text-2xl md:text-4xl font-semibold text-white">
                  صفحه پیدا نشد
                </h2>
              </div>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                متأسفانه صفحه‌ای که دنبال آن می‌گردید در قفسه کتاب‌های ما پیدا
                نشد. شاید کتاب مورد نظرتان به قفسه دیگری منتقل شده باشد!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link href="/books">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#00FF99] hover:bg-[#00FF99]/90 text-black font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Home className="w-5 h-5 ml-2" />
                  بازگشت به کتابخانه
                </Button>
              </Link>

              <Link href="/wishlist">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-8 py-3 rounded-xl transition-all duration-200"
                >
                  <Heart className="w-5 h-5 ml-2" />
                  لیست خرید
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Link href="/books">
            <Card className="bg-gray-800/30 border-gray-700 hover:border-[#00FF99]/50 transition-all duration-200 hover:bg-gray-800/50 group cursor-pointer">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-[#00FF99] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  همه کتاب‌ها
                </h3>
                <p className="text-sm text-gray-400">مشاهده کتابخانه کامل</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/books/add">
            <Card className="bg-gray-800/30 border-gray-700 hover:border-[#00FF99]/50 transition-all duration-200 hover:bg-gray-800/50 group cursor-pointer">
              <CardContent className="p-6 text-center">
                <Plus className="w-8 h-8 text-[#00FF99] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  افزودن کتاب
                </h3>
                <p className="text-sm text-gray-400">کتاب جدید اضافه کنید</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/account">
            <Card className="bg-gray-800/30 border-gray-700 hover:border-[#00FF99]/50 transition-all duration-200 hover:bg-gray-800/50 group cursor-pointer">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-[#00FF99] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  آمار و گزارش
                </h3>
                <p className="text-sm text-gray-400">مشاهده داشبورد</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="pt-8">
          <p className="text-sm text-gray-400 mb-6">
            یا از این لینک‌های مفید استفاده کنید:
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/books"
              className="flex items-center gap-2 text-[#00FF99] hover:text-[#00FF99]/80 transition-colors group"
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              همه کتاب‌ها
            </Link>
            <Link
              href="/books/add"
              className="flex items-center gap-2 text-[#00FF99] hover:text-[#00FF99]/80 transition-colors group"
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              افزودن کتاب جدید
            </Link>
            <Link
              href="/wishlist"
              className="flex items-center gap-2 text-[#00FF99] hover:text-[#00FF99]/80 transition-colors group"
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              لیست خرید
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-2 text-[#00FF99] hover:text-[#00FF99]/80 transition-colors group"
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              آمار و گزارش
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#00FF99]/30 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-16 w-1 h-1 bg-[#00FF99]/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-[#00FF99]/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-[#00FF99]/30 rounded-full animate-ping"></div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(12deg);
          }
          50% {
            transform: translateY(-10px) rotate(12deg);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) rotate(-12deg);
          }
          50% {
            transform: translateY(-8px) rotate(-12deg);
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) rotate(6deg);
          }
          50% {
            transform: translateY(-6px) rotate(6deg);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 0.5s;
        }

        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite 1s;
        }
      `}</style>
    </div>
  );
}
