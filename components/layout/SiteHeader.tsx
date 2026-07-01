"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBookOpen } from "react-icons/fa";

import MobileNav from "@/components/layout/MobileNav";
import ThemeToggle from "@/components/layout/ThemeToggle";
import type { LayoutUser } from "@/components/layout/types";
import UserMenu from "@/components/layout/UserMenu";
import SearchComponent from "@/components/SearchComponent";
import { Button } from "@/components/ui/button";
import { getPrimaryNav } from "@/lib/layout/navigation";
import { cn } from "@/lib/utils";

export interface HeaderUser extends LayoutUser {}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="صفحه اصلی قفسه"
      className="group flex items-center gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-primary/12 text-primary shadow-sm shadow-black/5 transition-colors group-hover:border-primary/25 group-hover:bg-primary/18">
        <FaBookOpen className="h-4 w-4" />
      </span>
      <span
        className={cn(
          "font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary",
          compact ? "text-lg" : "text-xl",
        )}
      >
        قفسه
      </span>
    </Link>
  );
}

export default function SiteHeader({
  user,
  isAdmin = false,
}: {
  user?: HeaderUser | null;
  isAdmin?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isAuthenticated = Boolean(user);
  const primaryNav = useMemo(() => getPrimaryNav(user?.username), [user?.username]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/75 bg-background/78 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="hidden h-[4.35rem] items-center gap-4 lg:flex">
          <div className="flex min-w-[11rem] items-center">
            <Brand />
          </div>

          <nav
            aria-label="ناوبری اصلی"
            className="flex min-w-0 items-center gap-1"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-2xl px-3.5 py-2 text-sm font-medium transition-colors",
                  isActivePath(pathname, item.href)
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 justify-center px-2">
            <SearchComponent
              resultsHref="/books"
              className="w-full max-w-[28rem]"
            />
          </div>

          <div className="flex min-w-[10rem] items-center justify-end gap-2">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <UserMenu user={user} isAdmin={isAdmin} />
            ) : (
              <GuestActions />
            )}
          </div>
        </div>

        <div className="lg:hidden">
          <div className="flex min-h-16 items-center justify-between gap-2 py-3">
            <MobileNav
              user={user}
              isAdmin={isAdmin}
              searchResultsHref="/books"
              open={mobileOpen}
              onOpenChange={setMobileOpen}
            />

            <Brand compact />

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isAuthenticated && user ? (
                <UserMenu user={user} isAdmin={isAdmin} compact />
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="h-10 rounded-2xl px-4 text-sm font-bold"
                >
                  <Link href="/auth/login">ورود</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="pb-4">
            <SearchComponent
              resultsHref="/books"
              className="w-full"
              placeholder="جست‌وجو در قفسه..."
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function GuestActions() {
  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant="ghost"
        className="h-10 rounded-2xl px-4 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary"
      >
        <Link href="/auth/login">ورود</Link>
      </Button>
      <Button asChild className="h-10 rounded-2xl px-4 text-sm font-bold">
        <Link href="/auth/signup">ثبت‌نام</Link>
      </Button>
    </div>
  );
}
