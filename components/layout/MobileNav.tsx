"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ElementType } from "react";
import {
  BookOpen,
  Home,
  Menu,
  Newspaper,
  PenTool,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getPrimaryNav } from "@/lib/layout/navigation";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileNav({
  user,
  open,
  onOpenChange,
}: {
  user?: any | null;
  isAdmin?: boolean;
  searchResultsHref: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const primaryLinks = getPrimaryNav(user?.username);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="باز کردن منوی سایت"
          className="h-[42px] w-[42px] rounded-xl border border-border/40 bg-card/40 text-muted-foreground hover:bg-card/60 hover:text-foreground active:bg-card/80 transition-colors shadow-none flex items-center justify-center"
        >
          {open ? (
            <X className="h-[18px] w-[18px]" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        hideClose
        className="w-[320px] max-w-[86vw] border-border/40 bg-card/95 p-0 text-foreground backdrop-blur-xl flex flex-col"
      >
        {/* Simplified Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/40 px-4 shrink-0">
          <SheetTitle className="text-lg font-black tracking-tight text-foreground">
            منوی قفسه
          </SheetTitle>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="بستن منو"
              className="h-[42px] w-[42px] rounded-xl border border-border/40 bg-card/40 text-muted-foreground hover:bg-card/60 hover:text-foreground active:bg-card/80 transition-colors shadow-none flex items-center justify-center"
            >
              <X className="h-[18px] w-[18px]" />
            </Button>
          </SheetClose>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          {primaryLinks.map((item) => (
            <MobileLink
              key={item.label}
              href={item.href}
              label={item.label}
              active={isActivePath(pathname, item.href)}
              onSelect={() => onOpenChange(false)}
              icon={
                item.label === "خانه"
                  ? Home
                  : item.label === "کتاب‌ها" || item.label === "کتابها"
                    ? BookOpen
                    : item.label === "نویسنده‌ها" || item.label === "نویسندهها"
                      ? PenTool
                      : Newspaper
              }
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileLink({
  href,
  label,
  active,
  onSelect,
  icon: Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  onSelect: () => void;
  icon?: ElementType;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={cn(
        "flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-all relative",
        active
          ? "bg-primary/8 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground active:bg-muted/80"
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "h-[18px] w-[18px] transition-colors",
            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
      ) : null}
      <span>{label}</span>

      {/* Subtle indicator for active state - on the right edge in RTL */}
      {active && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
      )}
    </Link>
  );
}
