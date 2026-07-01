"use client";

import { cn } from "@/lib/utils";

/**
 * نشانگر ساده‌ی قدرت رمز عبور بر اساس همان قواعد اعتبارسنجی سرور
 * (طول، وجود حرف، وجود عدد) به‌علاوه‌ی نشانه‌های کمکی (طول بیشتر و کاراکتر خاص).
 */
function scorePassword(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-zA-Z]/.test(value) && /[0-9]/.test(value)) score++;
  if (value.length >= 12) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  return Math.min(score, 4);
}

const LABELS = ["خیلی ضعیف", "ضعیف", "متوسط", "خوب", "قوی"];
const COLORS = [
  "bg-muted",
  "bg-destructive",
  "bg-amber-500",
  "bg-yellow-400",
  "bg-primary",
];

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const score = scorePassword(value);

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= score ? COLORS[score] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        قدرت رمز: <span className="text-foreground">{LABELS[score]}</span>
      </p>
    </div>
  );
}
