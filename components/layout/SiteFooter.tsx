import Link from "next/link";
import { FaBookOpen } from "react-icons/fa";
import { FiGithub, FiInstagram, FiSend, FiTwitter } from "react-icons/fi";

import type { LayoutUser } from "@/components/layout/types";
import {
  FOOTER_LEGAL_LINKS,
  getFooterPrimaryNav,
  getFooterUserLinks,
} from "@/lib/layout/navigation";

const SOCIAL = [
  { label: "Instagram", icon: FiInstagram },
  { label: "Telegram", icon: FiSend },
  { label: "X", icon: FiTwitter },
  { label: "GitHub", icon: FiGithub },
];

function Column({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-black text-foreground">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter({ user }: { user?: LayoutUser | null }) {
  const primaryLinks = getFooterPrimaryNav(user?.username);
  const userLinks = getFooterUserLinks(user?.username);

  return (
    <footer className="mt-16 border-t border-border/80 bg-card/65">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.8fr]">
          <div className="max-w-md">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-primary/12 text-primary shadow-sm shadow-black/5 transition-colors group-hover:border-primary/25 group-hover:bg-primary/18">
                <FaBookOpen className="h-4 w-4" />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-foreground">
                قفسه
              </span>
            </Link>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              یک کتابخانه اجتماعی برای دنبال‌کردن مطالعه، کشف کتاب‌ها و ثبت
              تکه‌ها و یادداشت‌ها.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {SOCIAL.map((item) => (
                <span
                  key={item.label}
                  aria-label={item.label}
                  title={`${item.label} — به‌زودی`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-background/70 text-muted-foreground"
                >
                  <item.icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          <Column title="ناوبری" links={primaryLinks} />
          <Column title="حساب کاربری" links={userLinks} />
          <Column title="راهنما" links={FOOTER_LEGAL_LINKS} />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/80 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 قفسه — همه حقوق محفوظ است.</p>
          <p>طراحی‌شده برای مطالعه آرام، منظم و مداوم</p>
        </div>
      </div>
    </footer>
  );
}
