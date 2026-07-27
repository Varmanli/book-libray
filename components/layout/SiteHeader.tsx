"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Search } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import MobileNav from "@/components/layout/MobileNav";
import type { LayoutUser } from "@/components/layout/types";
import UserMenu from "@/components/layout/UserMenu";
import SearchComponent from "@/components/SearchComponent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

function MobileSearchDialog({ searchResultsHref }: { searchResultsHref: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="جست‌وجو"
          className="h-[42px] w-[42px] rounded-xl border border-border/40 bg-card/40 text-muted-foreground hover:bg-card/60 hover:text-foreground active:bg-card/80 transition-colors shadow-none"
        >
          <Search className="h-[18px] w-[18px]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-[1.4rem] border-border/80 bg-card/95 p-4 pt-10 backdrop-blur-xl">
        <DialogTitle className="sr-only">جست‌وجوی سراسری</DialogTitle>
        <SearchComponent
          resultsHref={searchResultsHref}
          onSearch={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
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
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Desktop */}
        <div className="hidden h-14 items-center gap-4 lg:flex">
          <div className="flex min-w-[10rem] items-center">
            <Brand {...branding} />
          </div>

          <nav
            aria-label="ناوبری اصلی"
            className="flex min-w-0 items-center gap-1.5"
          >
            {primaryNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? "bg-primary/8 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-1 justify-center px-4">
            <SearchComponent
              resultsHref="/books"
              className="w-full max-w-[22rem]"
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
        <div className="relative flex h-14 items-center justify-between lg:hidden">
          {/* Right side: Menu */}
          <div className="flex items-center">
            <MobileNav
              user={user}
              isAdmin={isAdmin}
              searchResultsHref="/books"
              open={mobileOpen}
              onOpenChange={setMobileOpen}
            />
          </div>

          {/* Absolute Center: Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <Brand {...branding} compact />
          </div>

          {/* Left side: Search & User Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <MobileSearchDialog searchResultsHref="/books" />

            {isAuthenticated && user ? (
              <UserMenu user={user} isAdmin={isAdmin} compact />
            ) : (
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-[42px] w-[42px] rounded-xl border border-border/40 bg-card/40 text-muted-foreground hover:bg-card/60 hover:text-foreground active:bg-card/80 transition-colors shadow-none p-0"
              >
                <Link href="/auth/login" aria-label="ورود">
                  <LogIn className="h-[18px] w-[18px]" />
                </Link>
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
