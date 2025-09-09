import { Button } from "@/components/ui/button";
import background from "../public/bg.png";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen pt-5 p-6">
      <div className=" flex flex-col md:flex-row items-center gap-10  rounded-2xl p-8 backdrop-blur-sm">
        {/* متن خوش آمد */}
        <div className="flex-1 text-center md:text-right space-y-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
            به کتابخانه قفسه خوش آمدید 📚
          </h1>
          <p className="text-gray-350 leading-relaxed text-lg">
            توی قفسه می‌تونی عضو بشی، کتاب‌هات رو به پروفایل خودت اضافه کنی،
            لیست خرید بسازی، و ببینی تا حالا چند تا کتاب خوندی. با ما همیشه یه
            کتاب خوب دم دستته! ✨
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <Button size="lg" className="cursor-pointer">
              ثبت‌نام رایگان
            </Button>
            <Button size="lg" variant="secondary" className="cursor-pointer">
              ورود به حساب
            </Button>
          </div>
        </div>

        {/* تصویر */}
        <div className=" flex justify-center">
          <Image
            src={background}
            alt="کتابخانه"
            width={600}
            className="rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </main>
  );
}
