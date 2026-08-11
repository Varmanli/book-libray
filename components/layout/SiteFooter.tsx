import Link from "next/link";
import { FiGithub, FiInstagram, FiSend, FiTwitter } from "react-icons/fi";

import { BrandLogo } from "@/components/BrandLogo";
import type { LayoutUser } from "@/components/layout/types";

const SOCIAL = [
  { label: "Instagram", icon: FiInstagram, href: "#" },
  { label: "Telegram", icon: FiSend, href: "#" },
  { label: "X", icon: FiTwitter, href: "#" },
  { label: "GitHub", icon: FiGithub, href: "#" },
];

export default function SiteFooter({
  user,
  branding,
}: {
  user?: LayoutUser | null;
  branding: { logoUrl: string; siteName: string };
}) {
  const footerLinks = [
    { label: "صفحه اصلی", href: "/" },
    { label: "کتاب‌ها", href: "/books" },
    { label: "بلاگ", href: "/blog" },
    { label: "درباره ما", href: "/about" },
    { label: "قوانین", href: "/terms" },
    { label: "حریم خصوصی", href: "/privacy" },
    { label: "تماس", href: "/contact" },
  ];

  return (
    <footer className="mt-12 border-t border-border/40 bg-card/45 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Right side: Logo & Slogan */}
          <div className="flex flex-col items-center gap-2.5 md:items-start">
            <Link href="/" className="group inline-flex items-center">
              <BrandLogo
                logoUrl={branding.logoUrl}
                siteName={branding.siteName}
                size="mobile"
              />
            </Link>
            <p className="text-xs text-muted-foreground max-w-sm text-center md:text-right">
              یک کتابخانه اجتماعی مینی‌مال برای پیگیری مطالعه، ثبت یادداشت‌ها و
              اشتراک گذاری کتاب‌ها.
            </p>
          </div>

          {/* Center: Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Left side: Social Links */}
          <div className="flex items-center justify-center gap-3">
            {SOCIAL.map((item) => (
              <a
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 bg-background/50 text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                <item.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom divider & copyrights */}
        <div className="mt-6 border-t border-border/30 pt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-[11px] text-muted-foreground">
          <p className="text-center md:text-right">
            © ۲۰۲۶ {branding.siteName || "قفسه"} — تمامی حقوق محفوظ است.
          </p>
          <p className="text-center md:text-left">
            طراحی‌شده برای مطالعه آرام، منظم و مداوم
          </p>
        </div>
      </div>
    </footer>
  );
}
