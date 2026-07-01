"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  BookCopy,
  Building2,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Languages,
  Newspaper,
  PenTool,
  Plus,
  Settings,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/stats", label: "آمار", icon: BarChart3 },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/books", label: "کتاب‌ها", icon: BookCopy },
  { href: "/admin/books/new", label: "افزودن کتاب جدید", icon: Plus },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: Tags },
  { href: "/admin/authors", label: "نویسنده‌ها", icon: PenTool },
  { href: "/admin/publishers", label: "ناشرها", icon: Building2 },
  { href: "/admin/translators", label: "مترجم‌ها", icon: Languages },
  {
    href: "/admin/blog",
    label: "بلاگ",
    icon: Newspaper,
    children: [
      { href: "/admin/blog", label: "نوشته‌ها", icon: FileText },
      { href: "/admin/blog/categories", label: "دسته‌بندی‌های بلاگ", icon: Tags },
    ],
  },
  { href: "/admin/approvals", label: "تایید اطلاعات جدید", icon: BadgeCheck },
  { href: "/admin/home-content", label: "محتوای صفحه اصلی", icon: LayoutTemplate },
  { href: "/admin/static-pages", label: "صفحات ثابت", icon: FileText },
  { href: "/admin/settings", label: "تنظیمات سایت", icon: Settings },
];

// همه‌ی مسیرهای «برگ» (آیتم‌های بدون فرزند + فرزندها) برای تشخیص دقیق فعال بودن.
const LEAF_HREFS = ADMIN_NAV.flatMap((item) =>
  item.children ? item.children.map((c) => c.href) : [item.href],
);

/** Active when it's the exact path, or the deepest matching prefix. */
function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/admin") return false;
  if (!pathname.startsWith(href + "/")) return false;
  // Don't highlight a parent when a more specific nav item also matches.
  return !LEAF_HREFS.some(
    (leaf) =>
      leaf !== href &&
      leaf.length > href.length &&
      (pathname === leaf || pathname.startsWith(leaf + "/")),
  );
}

function NavLink({
  item,
  active,
  nested,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
        nested ? "py-2 text-[13px]" : "py-2.5",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default function AdminNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {ADMIN_NAV.map((item) => {
        if (item.children) {
          const Icon = item.icon;
          return (
            <div key={item.href} className="space-y-1">
              <div className="flex items-center gap-3 px-3 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="space-y-1 border-r border-border/60 pe-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.label}
                    item={child}
                    active={isActive(pathname, child.href)}
                    nested
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        }
        return (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}
