"use client";

import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import type { LayoutUser } from "@/components/layout/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLibraryPath, getProfilePath } from "@/lib/library/paths";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  href: string;
  icon: ElementType;
}

function getDisplayName(user: LayoutUser) {
  return user.name?.trim() || user.username?.trim() || "کاربر قفسه";
}

function getInitial(user: LayoutUser) {
  return getDisplayName(user).charAt(0) || "ق";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function UserMenu({
  user,
  isAdmin = false,
  compact = false,
}: {
  user: LayoutUser;
  isAdmin?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const primaryItems = useMemo<MenuItem[]>(
    () => [
      {
        label: "پروفایل من",
        href: getProfilePath(user.username),
        icon: UserRound,
      },
      {
        label: "کتابخانه من",
        href: getLibraryPath(user.username),
        icon: BookOpen,
      },
      {
        label: "داشبورد",
        href: "/dashboard",
        icon: BarChart3,
      },
      {
        label: "تنظیمات",
        href: "/settings/profile",
        icon: Settings,
      },
    ],
    [user.username],
  );

  const adminItems = useMemo<MenuItem[]>(
    () => (isAdmin ? [{ label: "مدیریت", href: "/admin", icon: ShieldCheck }] : []),
    [isAdmin],
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("logout failed");
      }

      toast.success("خارج شدید");
      setOpen(false);
      router.push("/auth/login");
      router.refresh();
    } catch {
      toast.error("خروج ناموفق بود");
    } finally {
      setLoggingOut(false);
    }
  }

  const displayName = getDisplayName(user);
  const handle = user.username ? `@${user.username}` : user.email;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="منوی حساب کاربری"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          compact ? "h-10 w-10" : "h-10 w-10",
        )}
      >
        <Avatar className="h-full w-full border border-border/80 shadow-sm shadow-black/10">
          {user.image ? (
            <AvatarImage
              src={user.image}
              alt={displayName}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-secondary text-sm font-black text-foreground">
            {getInitial(user)}
          </AvatarFallback>
        </Avatar>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-[1.7rem] border border-border/80 bg-card/95 p-2 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <div className="rounded-[1.25rem] border border-border/70 bg-background/65 px-3.5 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border border-border/70">
                {user.image ? (
                  <AvatarImage
                    src={user.image}
                    alt={displayName}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-secondary text-sm font-black text-foreground">
                  {getInitial(user)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-foreground">
                  {displayName}
                </p>
                {handle ? (
                  <p dir="ltr" className="truncate text-xs text-muted-foreground">
                    {handle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="my-2 h-px bg-border" />

          <div className="space-y-1">
            {primaryItems.map((item) => (
              <MenuLink
                key={item.label}
                item={item}
                active={isActivePath(pathname, item.href)}
                onSelect={() => setOpen(false)}
              />
            ))}
          </div>

          {adminItems.length > 0 ? (
            <>
              <div className="my-2 h-px bg-border" />
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <MenuLink
                    key={item.label}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    onSelect={() => setOpen(false)}
                  />
                ))}
              </div>
            </>
          ) : null}

          <div className="my-2 h-px bg-border" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-[1.1rem] px-3 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>{loggingOut ? "در حال خروج..." : "خروج"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  item,
  active,
  onSelect,
}: {
  item: MenuItem;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-[1.1rem] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        active
          ? "bg-primary/12 text-primary"
          : "text-foreground hover:bg-primary/5 hover:text-primary",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}
