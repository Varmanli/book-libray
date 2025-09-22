"use client";
import Link from "next/link";
import { BookOpen, Heart, BarChart3 } from "lucide-react";

export default function Footer() {
  const navigationItems = [
    {
      name: "کتابخانه",
      href: "/books",
      icon: BookOpen,
    },
    {
      name: "لیست خرید",
      href: "/wishlist",
      icon: Heart,
    },
    {
      name: "آمار و گزارش",
      href: "/account",
      icon: BarChart3,
    },
  ];

  return (
    <footer className="mt-20 border-t border-gray-800 bg-gray-900/70 backdrop-blur-md">
      <div className="container mx-auto  flex flex-col items-center gap-8">
        <div className="flex flex-col pt-6 md:flex-row justify-between items-center gap-5 w-full">
          {/* جمله الهام‌بخش */}
          <p className="text-center text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl">
            «کتاب، گنجینه‌ای است که بارها و بارها می‌توان به سراغش رفت و هر بار
            چیز تازه‌ای یافت.»
          </p>
          {/* منو */}
          <nav className="flex gap-6 md:gap-10">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center group"
              >
                <div className="p-3 rounded-full bg-gray-800/50 border border-gray-700 text-gray-400 group-hover:text-[#00FF99] group-hover:border-[#00FF99]/40 transition-all duration-200">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="mt-2 text-xs text-gray-400 group-hover:text-white transition-colors">
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* کپی‌رایت */}
        <div className="w-full border-t border-gray-800 py-4 text-sm text-center text-gray-300">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://varmanli.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00FF99] transition-colors"
          >
            varmanli.ir
          </a>{" "}
          — همه حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
