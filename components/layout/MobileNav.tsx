"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  Home,
  Menu,
  Newspaper,
  PenTool,
  X,
} from "lucide-react";

import type { LayoutUser } from "@/components/layout/types";
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
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getNavigationIcon(href: string, label: string): ElementType {
  if (href === "/") {
    return Home;
  }

  if (href.startsWith("/books")) {
    return BookOpen;
  }

  if (href.startsWith("/authors")) {
    return PenTool;
  }

  if (
    href.startsWith("/articles") ||
    href.startsWith("/blog") ||
    href.startsWith("/posts")
  ) {
    return Newspaper;
  }

  /*
   * Fallback برای لینک‌هایی که route مشخصی ندارند.
   * تشخیص اصلی بر اساس href انجام می‌شود تا UI
   * وابسته به متن فارسی navigation نباشد.
   */
  if (label.includes("کتاب")) {
    return BookOpen;
  }

  if (label.includes("نویسنده")) {
    return PenTool;
  }

  return Newspaper;
}

export default function MobileNav({
  user,
  open,
  onOpenChange,
}: {
  user?: LayoutUser | null;
  isAdmin?: boolean;
  searchResultsHref: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();

  const primaryLinks = getPrimaryNav(user?.username);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Trigger */}
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="باز کردن منو"
          className={cn(
            `
              size-10 rounded-xl
              border border-border/50
              bg-card/45
              p-0
              text-muted-foreground
              shadow-none

              transition-all duration-200

              hover:border-border
              hover:bg-card/80
              hover:text-foreground

              active:scale-95

              focus-visible:ring-2
              focus-visible:ring-primary/30
              focus-visible:ring-offset-2
              focus-visible:ring-offset-background
            `,
            open &&
              `
                border-primary/20
                bg-primary/[0.07]
                text-primary
              `,
          )}
        >
          <Menu className="size-[18px]" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        hideClose
        dir="rtl"
        className="
          flex h-full
          w-[19rem] max-w-[88vw]
          flex-col
          border-l border-border/50
          bg-background/95
          p-0
          text-foreground
          shadow-2xl
          backdrop-blur-xl

          sm:w-[20rem]
        "
      >
        {/* Header */}
        <header
          className="
            shrink-0
            border-b border-border/45
            px-4 pb-4 pt-4
          "
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle
                className="
                  text-base font-black
                  tracking-tight
                  text-foreground
                "
              >
                منوی قفسه
              </SheetTitle>

              <p
                className="
                  mt-1
                  text-[10px] leading-5
                  text-muted-foreground
                "
              >
                دسترسی سریع به بخش‌های اصلی
              </p>
            </div>

            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="بستن منو"
                className="
                  size-10 shrink-0
                  rounded-xl
                  border border-border/50
                  bg-card/40
                  p-0
                  text-muted-foreground
                  shadow-none

                  transition-all duration-200

                  hover:border-border
                  hover:bg-card/80
                  hover:text-foreground

                  active:scale-95

                  focus-visible:ring-2
                  focus-visible:ring-primary/30
                "
              >
                <X className="size-[18px]" />
              </Button>
            </SheetClose>
          </div>
        </header>

        {/* Navigation */}
        <div
          className="
            flex min-h-0 flex-1
            flex-col
            overflow-hidden
          "
        >
          <div
            className="
              shrink-0
              px-4 pb-2 pt-4
            "
          >
            <p
              className="
                px-2
                text-[10px] font-bold
                text-muted-foreground/75
              "
            >
              دسترسی اصلی
            </p>
          </div>

          <nav
            aria-label="ناوبری موبایل"
            className="
              min-h-0 flex-1
              space-y-1
              overflow-y-auto
              overscroll-contain
              px-3 pb-5

              [scrollbar-width:thin]
            "
          >
            {primaryLinks.map((item) => {
              const active = isActivePath(pathname, item.href);

              const Icon = getNavigationIcon(item.href, item.label);

              return (
                <MobileLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={active}
                  icon={Icon}
                  onSelect={() => onOpenChange(false)}
                />
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <footer
          className="
            shrink-0
            border-t border-border/40
            bg-muted/[0.15]
            px-4 py-3
          "
        >
          <p
            className="
              text-center
              text-[9px] font-medium
              text-muted-foreground/60
            "
          >
            قفسه، خانه‌ی کتاب‌های تو
          </p>
        </footer>
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
  icon: ElementType;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        `
          group relative
          flex min-h-12 w-full
          items-center gap-3
          overflow-hidden
          rounded-xl
          px-3
          text-sm font-bold
          outline-none

          transition-all duration-150

          focus-visible:ring-2
          focus-visible:ring-primary/20
        `,
        active
          ? `
            bg-primary/[0.08]
            text-primary
            ring-1 ring-primary/10
          `
          : `
            text-foreground/80

            hover:bg-muted/50
            hover:text-foreground

            active:bg-muted/70
          `,
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          `
            flex size-8 shrink-0
            items-center justify-center
            rounded-lg

            transition-all duration-150
          `,
          active
            ? `
              bg-primary/10
              text-primary
            `
            : `
              bg-muted/55
              text-muted-foreground

              group-hover:bg-muted
              group-hover:text-foreground
            `,
        )}
      >
        <Icon className="size-4" />
      </span>

      {/* Label */}
      <span className="min-w-0 flex-1 truncate text-right">{label}</span>

      {/* Active / navigation state */}
      {active ? (
        <span
          className="
            flex shrink-0
            items-center gap-1.5
          "
        >
          <span
            className="
              size-1.5
              rounded-full
              bg-primary
            "
          />

          <ChevronLeft
            className="
              size-3.5
              text-primary/70
            "
          />
        </span>
      ) : (
        <ChevronLeft
          className="
            size-3.5 shrink-0
            translate-x-1
            text-muted-foreground/35
            opacity-0

            transition-all duration-150

            group-hover:translate-x-0
            group-hover:opacity-100
          "
        />
      )}

      {/* Active edge */}
      {active ? (
        <span
          aria-hidden
          className="
            absolute right-0
            top-1/2
            h-6 w-[3px]
            -translate-y-1/2
            rounded-l-full
            bg-primary
          "
        />
      ) : null}
    </Link>
  );
}
