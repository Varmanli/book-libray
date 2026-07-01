"use client";

import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  LogIn,
  Menu,
  Newspaper,
  PenTool,
  Settings,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { FaBookOpen } from "react-icons/fa";

import type { LayoutUser } from "@/components/layout/types";
import SearchComponent from "@/components/SearchComponent";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getLibraryPath, getProfilePath } from "@/lib/library/paths";
import { getPrimaryNav } from "@/lib/layout/navigation";

function getDisplayName(user?: LayoutUser | null) {
  return user?.name?.trim() || user?.username?.trim() || "کاربر قفسه";
}

function getInitial(user?: LayoutUser | null) {
  return getDisplayName(user).charAt(0) || "ق";
}

export default function MobileNav({
  user,
  isAdmin = false,
  searchResultsHref,
  open,
  onOpenChange,
}: {
  user?: LayoutUser | null;
  isAdmin?: boolean;
  searchResultsHref: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isAuthenticated = Boolean(user);
  const primaryLinks = getPrimaryNav(user?.username);
  const userLinks = isAuthenticated
    ? [
        {
          label: "پروفایل من",
          href: getProfilePath(user?.username),
          icon: UserRound,
        },
        {
          label: "کتابخانه من",
          href: getLibraryPath(user?.username),
          icon: BookOpen,
        },
        { label: "داشبورد", href: "/dashboard", icon: BarChart3 },
        { label: "تنظیمات", href: "/settings/profile", icon: Settings },
        ...(isAdmin
          ? [{ label: "مدیریت", href: "/admin", icon: ShieldCheck }]
          : []),
      ]
    : [
        { label: "ورود", href: "/auth/login", icon: LogIn },
        { label: "ثبت‌نام", href: "/auth/signup", icon: UserPlus },
      ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="باز کردن منوی سایت"
          className="h-10 w-10 rounded-2xl border border-border/80 bg-card/80 text-foreground shadow-sm shadow-black/5 hover:border-primary/20 hover:bg-primary/5"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[22rem] border-border/80 bg-card/95 p-0 text-foreground backdrop-blur-xl"
      >
        <SheetHeader className="border-b border-border/80 px-5 py-4 text-right">
          <SheetTitle className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-primary/12 text-primary">
              <FaBookOpen className="h-4 w-4" />
            </span>
            <span className="text-lg font-black tracking-tight">منوی قفسه</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex h-full flex-col">
          <div className="border-b border-border/80 px-5 py-4">
            <SearchComponent resultsHref={searchResultsHref} />
          </div>

          {user ? (
            <div className="border-b border-border/80 px-5 py-4">
              <div className="flex items-center gap-3 rounded-[1.3rem] border border-border/70 bg-background/65 p-3">
                <Avatar className="h-11 w-11 border border-border/70">
                  {user.image ? (
                    <AvatarImage
                      src={user.image}
                      alt={getDisplayName(user)}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-secondary text-sm font-black text-foreground">
                    {getInitial(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-foreground">
                    {getDisplayName(user)}
                  </p>
                  {user.username ? (
                    <p dir="ltr" className="truncate text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <SectionTitle>ناوبری</SectionTitle>
            <div className="space-y-1">
              {primaryLinks.map((item) => (
                <MobileLink
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  onSelect={() => onOpenChange(false)}
                  icon={
                    item.label === "خانه"
                      ? undefined
                      : item.label === "کتاب‌ها"
                        ? BookOpen
                        : item.label === "نویسنده‌ها"
                          ? PenTool
                          : Newspaper
                  }
                />
              ))}
            </div>

            <div className="mt-5">
              <SectionTitle>{user ? "حساب کاربری" : "ورود و عضویت"}</SectionTitle>
              <div className="space-y-1">
                {userLinks.map((item) => (
                  <MobileLink
                    key={item.label}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    onSelect={() => onOpenChange(false)}
                  />
                ))}
              </div>
            </div>
          </nav>

          <div className="border-t border-border/80 px-5 py-4">
            <div className="flex items-center justify-between rounded-[1.2rem] border border-border/70 bg-background/65 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-foreground">تم سایت</p>
                <p className="text-xs text-muted-foreground">
                  بین حالت روشن و تیره جابه‌جا شو
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 px-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function MobileLink({
  href,
  label,
  onSelect,
  icon: Icon,
}: {
  href: string;
  label: string;
  onSelect: () => void;
  icon?: ElementType;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex min-h-11 items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
    >
      {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      <span>{label}</span>
    </Link>
  );
}
