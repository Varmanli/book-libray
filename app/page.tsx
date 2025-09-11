"use client";

import { Button } from "@/components/ui/button";
import background from "../public/bg.png";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center h-screen p-1 md:p-6">
      <div className="flex flex-col md:flex-row items-center gap-15 md:gap-10 rounded-2xl mt-4 p-2 md:p-5 backdrop-blur-sm w-full ">
        {/* متن خوش آمد */}
        <div className="flex-[4] text-center md:text-right space-y-3 md:space-y-6">
          <h1 className="text-xl md:text-3xl font-extrabold text-primary">
            به کتابخانه قفسه خوش آمدید📚
          </h1>
          <p className="text-gray-350 leading-relaxed text-center text-sm md:text-lg">
            توی قفسه می‌تونی عضو بشی، کتاب‌هات رو به پروفایل خودت اضافه کنی،
            لیست خرید بسازی، و ببینی تا حالا چند تا کتاب خوندی.
            <br /> با ما همیشه یه کتاب خوب دم دستته! ✨
          </p>
          <div className="flex  justify-center  gap-4">
            <Link href="/login">
              <Button size="lg" className="text-lg p-6 cursor-pointer">
                ورود یا ثبت نام
              </Button>
            </Link>
          </div>
        </div>

        {/* تصویر */}
        <div className="flex-[7] flex justify-center">
          <Image
            src={background}
            alt="کتابخانه"
            width={800}
            className="rounded-2xl shadow-lg w-full object-cover"
          />
        </div>
      </div>
    </main>
  );
}
