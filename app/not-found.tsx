"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, Search, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Book Icon Animation */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl animate-pulse"></div>
            <div className="absolute inset-2 bg-primary/20 rounded-2xl animate-bounce"></div>
            <BookOpen className="absolute inset-0 w-full h-full text-primary p-6 animate-pulse" />
          </div>

          {/* Floating Books */}
          <div className="absolute -top-4 -left-8 w-8 h-12 bg-orange-200 rounded rotate-12 animate-float"></div>
          <div className="absolute -top-2 -right-6 w-6 h-10 bg-blue-200 rounded -rotate-12 animate-float-delayed"></div>
          <div className="absolute -bottom-2 -left-4 w-7 h-11 bg-green-200 rounded rotate-6 animate-float-slow"></div>
        </div>

        {/* Error Content */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-semibold text-foreground">
            صفحه پیدا نشد
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            متأسفانه صفحه‌ای که دنبال آن می‌گردید در قفسه کتاب‌های ما پیدا نشد.
            شاید کتاب مورد نظرتان به قفسه دیگری منتقل شده باشد!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          <Link href="/books">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              <Home className="w-5 h-5 ml-2" />
              بازگشت به کتابخانه
            </Button>
          </Link>

          <Link href="/wishlist">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Search className="w-5 h-5 ml-2" />
              لیست خرید
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            یا از این لینک‌های مفید استفاده کنید:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/books"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              همه کتاب‌ها
            </Link>
            <Link
              href="/books/add"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              افزودن کتاب جدید
            </Link>
            <Link
              href="/wishlist"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              لیست خرید
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-16 w-1 h-1 bg-primary/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-primary/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-primary/30 rounded-full animate-ping"></div>
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
