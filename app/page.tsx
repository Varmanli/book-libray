"use client";

import { Button } from "@/components/ui/button";
import background from "../public/bg.png";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen px-4 md:px-10 bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
      {/* کانتینر */}
      <div className="flex flex-col md:flex-row items-center gap-12 rounded-2xl mt-6 p-6 md:p-10 w-full max-w-7xl backdrop-blur-sm bg-white/5 shadow-xl">
        {/* متن معرفی */}
        <div className="flex-[4] text-center md:text-right space-y-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary drop-shadow-md">
            به قفسه خوش آمدید 📚
          </h1>
          <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-xl mx-auto md:mx-0">
            <span className="text-indigo-400 font-semibold">قفسه</span> جاییه
            برای <span className="text-primary font-bold">کتابخون‌های جدی</span>
            .
            <br />
            کتاب‌هاتو اضافه کن، وضعیت خوندنت رو مشخص کن و یادداشت‌ها و
            هایلایت‌هات رو همیشه کنار خودت داشته باش.
            <br />
            برای خرید بعدی هم{" "}
            <span className="text-pink-400 font-semibold">
              لیست اولویت‌دار
            </span>{" "}
            بساز تا هیچ کتاب خوبی رو از دست ندی.
            <br />
            همه کتاب‌هات، یه جا، مرتب و دم دستت ✨
          </p>

          <div className="flex justify-start gap-4 pt-2">
            <Link href="/login">
              <Button
                size="lg"
                className="text-lg px-8 py-6 cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:scale-105 transition-transform"
              >
                ورود یا ثبت نام
              </Button>
            </Link>
          </div>
        </div>

        {/* تصویر */}
        <div className="flex-[6] flex justify-center">
          <Image
            src={background}
            alt="نویسندگان کلاسیک"
            width={700}
            className="rounded-2xl shadow-2xl border border-gray-700 object-cover"
          />
        </div>
      </div>
    </main>
  );
}
