"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const label = !mounted
    ? "تغییر تم"
    : isDark
      ? "روشن کردن تم"
      : "تیره کردن تم";
  const title = !mounted ? "تغییر تم" : isDark ? "حالت روشن" : "حالت تیره";

  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl border border-border/80 bg-card/80 text-muted-foreground shadow-sm shadow-black/5 backdrop-blur transition-colors hover:border-primary/20 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "h-10 w-10 sm:h-10 sm:w-10",
        className,
      )}
    >
      {!mounted ? (
        <Sun className="h-4 w-4 opacity-0" />
      ) : isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
