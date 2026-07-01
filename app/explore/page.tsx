import StaticContentPage from "@/components/layout/StaticContentPage";

export const dynamic = "force-dynamic";

export default function ExplorePage() {
  return (
    <StaticContentPage
      eyebrow="اکسپلور"
      title="کشف کتاب‌ها و مسیرهای خواندن"
      description="این بخش در حال تبدیل‌شدن به سطح عمومی کشف کتاب در قفسه است. فعلا از همین‌جا می‌توانی وارد جست‌وجو، صفحه کتاب‌ها و قفسه‌های عمومی شوی."
      ctaLabel="بازگشت به خانه"
      ctaHref="/"
      sections={[
        {
          title: "کشف کتاب‌های تازه",
          body: "به‌زودی این صفحه کتاب‌های عمومی، نقل‌قول‌های تازه و پیشنهادهای خواندنی را در یک نمای متمرکز کنار هم نشان می‌دهد.",
        },
        {
          title: "جست‌وجوی یکپارچه",
          body: "منطق جست‌وجوی فعلی حفظ شده است و این صفحه برای دریافت نسخه کامل‌تر تجربه اکسپلور آماده شده است.",
        },
      ]}
    />
  );
}
