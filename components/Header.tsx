"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

import { IoLibrary } from "react-icons/io5";
import { FiMenu } from "react-icons/fi";
import { FaBookOpen, FaHome, FaShoppingCart } from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6";
import { IoIosAddCircle } from "react-icons/io";
import Link from "next/link";

export default function Header() {
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("search:", q);
  }

  return (
    <header className="w-full  z-20 fixed bg-background">
      <div className="mx-auto px-4">
        <div className="flex justify-between items-center h-20 px-2 md:px-20">
          {/* راست: لوگو و منو موبایل */}
          <div className="w-full md:w-auto flex justify-between items-center gap-4 p-2">
            {/* منوی همبرگری موبایل */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <FiMenu size={30} />
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-6">
                  <SheetHeader>
                    <SheetTitle className="text-base font-bold text-right">
                      منوی قفسه
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-3 text-base mt-6">
                    <Link
                      href="/books"
                      className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-muted"
                    >
                      <IoLibrary size={22} />
                      <span>صفحه اصلی</span>
                    </Link>

                    <Link
                      href="/wishlist"
                      className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-muted"
                    >
                      <FaShoppingCart size={22} />
                      <span>لیست خرید</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-muted"
                    >
                      <FaCircleUser size={22} />
                      <span>حساب کاربری</span>
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            {/* لوگو */}
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <FaBookOpen className="h-6 w-6 text-primary" />
              </span>
              <span className="text-2xl font-extrabold tracking-tight">
                قفسه
              </span>
            </Link>
          </div>

          {/* وسط: جستجو */}
          <div className="flex-1 hidden md:flex justify-center px-4">
            <form
              onSubmit={onSearch}
              className="relative flex w-full max-w-2xl gap-2"
            >
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جست‌وجو در قفسه..."
                className="  h-14 text-lg rounded-2xl pr-4 shadow-sm flex-1"
                aria-label="جست‌وجو در قفسه"
              />
              <Button
                type="submit"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-2xl px-6 h-11 shadow-md"
              >
                جست‌وجو
              </Button>
            </form>
          </div>

          {/* چپ: آیکون‌ها */}
          <div className="hidden md:flex justify-center items-center gap-4 text-primary">
            <TooltipProvider>
              <Link href="/books">
                <Tooltip>
                  <TooltipTrigger>
                    <IoLibrary size={33} className="cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">کتابخانه</TooltipContent>
                </Tooltip>
              </Link>
              <Link href="/wishlist">
                <Tooltip>
                  <TooltipTrigger>
                    <FaShoppingCart size={32} className="cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">لیست خرید</TooltipContent>
                </Tooltip>
              </Link>
              <Link href="/profile">
                <Tooltip>
                  <TooltipTrigger>
                    <FaCircleUser size={33} className="cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">حساب کاربری</TooltipContent>
                </Tooltip>
              </Link>
              <Link href="/books/add">
                <Tooltip>
                  <TooltipTrigger>
                    <IoIosAddCircle size={40} className="cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">افزودن کتاب</TooltipContent>
                </Tooltip>
              </Link>
            </TooltipProvider>
          </div>
        </div>

        {/* سرچ برای موبایل */}
        <div className="flex md:hidden px-2 pb-3">
          <form
            onSubmit={onSearch}
            className="relative flex w-full max-w-2xl gap-2"
          >
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جست‌وجو در قفسه..."
              className="  h-14 text-lg rounded-2xl pr-4 shadow-sm flex-1"
              aria-label="جست‌وجو در قفسه"
            />
            <Button
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-2xl px-6 h-11 shadow-md"
            >
              جست‌وجو
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
