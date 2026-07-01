import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:p-7",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="relative z-10">
        <div className="mb-8 space-y-3 text-right">
          <span className="inline-flex rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold text-emerald-100/90">
            ورود امن به کتابخانه‌ی شخصی
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-[2rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm leading-7 text-white/62 sm:text-[0.95rem]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {children}

        {footer ? (
          <div className="relative mt-7 border-t border-white/10 pt-5 text-sm text-white/56">
            {footer}
          </div>
        ) : null}
      </div>
    </section>
  );
}
