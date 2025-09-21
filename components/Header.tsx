"use client";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import SearchComponent from "@/components/SearchComponent";

import { IoLibrary } from "react-icons/io5";
import { FiMenu, FiX } from "react-icons/fi";
import {
  FaBookOpen,
  FaHome,
  FaShoppingCart,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaPlus,
} from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6";
import { IoIosAddCircle } from "react-icons/io";
import {
  BookOpen,
  Heart,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  const navigationItems = [
    {
      name: "کتابخانه",
      href: "/books",
      icon: BookOpen,
      description: "مشاهده کتاب‌های موجود",
    },
    {
      name: "لیست خرید",
      href: "/wishlist",
      icon: Heart,
      description: "مدیریت لیست خرید",
    },
    {
      name: "آمار و گزارش",
      href: "/account",
      icon: BarChart3,
      description: "داشبورد و آمار",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-2  backdrop-blur-md border-b border-gray-800 ">
      <div className="mx-auto px-4">
        <div className="flex justify-between items-center h-16 px-2 md:mx-20">
          {/* راست: لوگو و منو موبایل */}
          <div className="w-full md:w-auto flex justify-between items-center gap-4 p-2">
            {/* منوی همبرگری موبایل */}
            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-800 transition-colors"
                  >
                    <Menu className="h-6 w-6 text-gray-300" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 p-0 bg-gray-900 border-gray-800"
                >
                  <div className="flex flex-col h-full">
                    <SheetHeader className="p-6 border-b border-gray-800">
                      <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold text-white">
                          منوی قفسه
                        </SheetTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsMenuOpen(false)}
                          className="p-2 hover:bg-gray-800"
                        >
                          <X className="h-5 w-5 text-gray-400" />
                        </Button>
                      </div>
                    </SheetHeader>

                    <nav className="flex-1 p-6 space-y-2">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 group ${
                            isActive(item.href)
                              ? "bg-[#00FF99]/20 text-[#00FF99] border border-[#00FF99]/30"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 transition-colors ${
                              isActive(item.href)
                                ? "text-[#00FF99]"
                                : "text-gray-400 group-hover:text-white"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500 group-hover:text-gray-300">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      ))}

                      <div className="pt-4 border-t border-gray-800">
                        <Link
                          href="/books/add"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-4 rounded-xl px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 group"
                        >
                          <FaPlus className="h-5 w-5 text-gray-400 group-hover:text-white" />
                          <div className="flex-1">
                            <div className="font-medium">افزودن کتاب</div>
                            <div className="text-xs text-gray-500 group-hover:text-gray-300">
                              کتاب جدید اضافه کنید
                            </div>
                          </div>
                        </Link>
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* لوگو */}
            <Link href="/" className="flex items-center gap-3 group">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00FF99]/10 group-hover:bg-[#00FF99]/20 transition-colors">
                <FaBookOpen className="h-6 w-6 text-[#00FF99]" />
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-white group-hover:text-[#00FF99] transition-colors">
                قفسه
              </span>
            </Link>
          </div>

          {/* وسط: جستجو */}
          <div className="flex-1 hidden md:flex justify-center px-4">
            <SearchComponent
              onSearch={handleSearch}
              className="w-full max-w-2xl"
            />
          </div>

          {/* چپ: آیکون‌ها */}
          <div className="hidden md:flex justify-center items-center gap-2">
            <TooltipProvider>
              {navigationItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="lg"
                        className={`p-3 transition-all duration-200 ${
                          isActive(item.href)
                            ? "bg-[#00FF99]/20 text-[#00FF99] hover:bg-[#00FF99]/30"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                        }`}
                      >
                        <item.icon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-gray-800 text-white border-gray-700"
                    >
                      {item.description}
                    </TooltipContent>
                  </Tooltip>
                </Link>
              ))}

              <Link href="/books/add">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
                    >
                      <IoIosAddCircle className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-gray-800 text-white border-gray-700"
                  >
                    افزودن کتاب
                  </TooltipContent>
                </Tooltip>
              </Link>
            </TooltipProvider>
          </div>
        </div>

        {/* سرچ برای موبایل */}
        <div className="flex md:hidden px-2 pb-3">
          <SearchComponent onSearch={handleSearch} className="w-full" />
        </div>
      </div>
    </header>
  );
}
