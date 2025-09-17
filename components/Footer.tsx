import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="container mx-auto  py-8 flex flex-col items-center gap-6">
        {/* بالا: جمله + منو در دو گوشه */}
        <div className="w-full">
          <p className="text-center">
            «کتاب، گنجینه‌ای است که بارها و بارها می‌توان به سراغش رفت و هر بار
            چیز تازه‌ای یافت.»
          </p>
        </div>

        {/* کپی‌رایت پایین وسط */}
        <div className="w-full border-t pt-4 text-sm text-center">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://varmanli.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            varmanli.ir
          </a>{" "}
          — همه حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
