"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, UserCog, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/settings/profile", label: "پروفایل", icon: UserCog },
  { href: "/settings/account", label: "حساب کاربری", icon: ShieldCheck },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
          <Settings className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          تنظیمات
        </h1>
      </div>

      <nav className="mb-6 flex gap-1 rounded-2xl border border-border/70 bg-muted/30 p-1.5">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
