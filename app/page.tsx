"use client";

import { Button } from "@/components/ui/button";
import background from "../public/bg.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingBooks from "@/components/LoadingBooks";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false); // برای نمایش لودینگ روی دکمه

  const handleAuthClick = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // ارسال کوکی HttpOnly
      });

      if (res.ok) {
        // توکن معتبر → مستقیم به صفحه کتاب‌ها
        router.push("/books");
      } else {
        // توکن موجود نیست یا نامعتبر → صفحه لاگین
        router.push("/login");
      }
    } catch (err) {
      console.error("❌ خطا در بررسی توکن:", err);
      router.push("/login");
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen px-4 md:px-10 bg-[#1C1C22] text-white">
      <div className="flex flex-col justify-center md:flex-row items-center gap-12 rounded-2xl mt-6 p-6 md:p-10 w-full max-w-7xl backdrop-blur-sm bg-[#26262E]/50 shadow-xl border border-gray-700">
        {/* متن معرفی */}
        <div className="flex-[4] text-center md:text-right space-y-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#00FF99] drop-shadow-md">
            به قفسه خوش آمدید 📚
          </h1>
          <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-xl mx-auto md:mx-0">
            <span className="text-[#00FF99] font-semibold">قفسه</span> جاییه
            برای{" "}
            <span className="text-[#00FF99] font-bold">کتابخون‌های جدی</span>
            .
            <br />
            کتاب‌هاتو اضافه کن، وضعیت خوندنت رو مشخص کن و یادداشت‌ها و
            هایلایت‌هات رو همیشه کنار خودت داشته باش.
            <br />
            برای خرید بعدی هم{" "}
            <span className="text-[#00FF99] font-semibold">
              لیست اولویت‌دار
            </span>{" "}
            بساز تا هیچ کتاب خوبی رو از دست ندی.
            <br />
            همه کتاب‌هات، یه جا، مرتب و دم دستت ✨
          </p>

          <div className="flex justify-center items-center gap-4 pt-2">
            <Button
              size="lg"
              onClick={handleAuthClick}
              disabled={checking}
              className="text-lg px-8 py-6 cursor-pointer bg-[#00FF99] hover:bg-[#00FF99]/90 text-black font-semibold hover:scale-105 transition-transform"
            >
              {checking ? "درحال ورود..." : "ورود یا ثبت نام"}
            </Button>
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
