"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/BrandLogo";
import MobileNav from "@/components/layout/MobileNav";
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

function Brand({
  logoUrl,
  siteName,
  compact = false,
}: {
  logoUrl: string;
  siteName: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={`صفحه اصلی ${siteName}`}
      className="group flex shrink-0 items-center"
    >
      <BrandLogo
        logoUrl={logoUrl}
        siteName={siteName}
        size={compact ? "mobile" : "header"}
        nameClassName="transition-colors group-hover:text-primary"
      />
    </Link>
  );
}

export default function SiteHeader({
  user,
  isAdmin = false,
  branding,
}: {
  user?: HeaderUser | null;
  isAdmin?: boolean;
  branding: {
    logoUrl: string;
    siteName: string;
  };
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isAuthenticated = Boolean(user);

  const primaryNav = useMemo(
    () => getPrimaryNav(user?.username),
    [user?.username],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Desktop */}
        <div className="hidden h-[4.35rem] items-center gap-4 lg:flex">
          <div className="flex min-w-[11rem] items-center">
            <Brand {...branding} />
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
                  "rounded-xl px-3.5 py-2 text-sm font-medium transition-all",
                  isActivePath(pathname, item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 justify-center px-3">
            <SearchComponent
              resultsHref="/books"
              className="w-full max-w-[28rem]"
            />
          </div>

          <div className="flex min-w-[10rem] items-center justify-end">
            {isAuthenticated && user ? (
              <UserMenu user={user} isAdmin={isAdmin} />
            ) : (
              <GuestActions />
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="flex h-16 items-center justify-between lg:hidden">
          {/* Right side */}
          <div className="flex min-w-0 items-center gap-1">
            <MobileNav
              user={user}
              isAdmin={isAdmin}
              searchResultsHref="/books"
              open={mobileOpen}
              onOpenChange={setMobileOpen}
            />

            <Brand {...branding} compact />
          </div>

          {/* Left side */}
          <div className="flex shrink-0 items-center">
            {isAuthenticated && user ? (
              <UserMenu user={user} isAdmin={isAdmin} compact />
            ) : (
              <Button
                asChild
                size="sm"
                className="h-9 rounded-xl px-3.5 text-sm font-bold"
              >
                <Link href="/auth/login">ورود</Link>
              </Button>
            )}
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
        className="h-10 rounded-xl px-4 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary"
      >
        <Link href="/auth/login">ورود</Link>
      </Button>

      <Button asChild className="h-10 rounded-xl px-4 text-sm font-bold">
        <Link href="/auth/signup">ثبت‌نام</Link>
      </Button>
    </div>
  );
}
