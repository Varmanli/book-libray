"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type TargetRect = Pick<DOMRect, "top" | "right" | "bottom" | "left">;

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";
const SPOTLIGHT_PADDING = 8;

export function OnboardingCoachmark({
  ariaLabel,
  stepIndex,
  stepCount,
  step,
  targetRect,
  onFinish,
  onNext,
}: {
  ariaLabel: string;
  stepIndex: number;
  stepCount: number;
  step: { title: string; description: string };
  targetRect: TargetRect;
  onFinish: () => void;
  onNext: () => void;
}) {
  const isMobile = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  const isFinalStep = stepIndex === stepCount - 1;
  const spotlightStyle = {
    top: Math.max(4, targetRect.top - SPOTLIGHT_PADDING),
    right: Math.max(4, window.innerWidth - targetRect.right - SPOTLIGHT_PADDING),
    bottom: Math.max(4, window.innerHeight - targetRect.bottom - SPOTLIGHT_PADDING),
    left: Math.max(4, targetRect.left - SPOTLIGHT_PADDING),
  };
  const placeCardToLeft = targetRect.left >= 360;
  const desktopCardStyle = placeCardToLeft
    ? {
        top: Math.min(targetRect.top, window.innerHeight - 196),
        right: Math.max(16, window.innerWidth - targetRect.left + 16),
      }
    : {
        top: Math.min(targetRect.bottom + 16, window.innerHeight - 196),
        left: Math.max(16, targetRect.left),
      };

  return (
    <div dir="rtl" aria-live="polite" aria-label={ariaLabel}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-[70] rounded-2xl border-2 border-primary/75 bg-transparent shadow-[0_0_0_9999px_rgba(8,14,11,0.55)] transition-all duration-200 motion-reduce:transition-none"
        style={spotlightStyle}
      />

      <section
        aria-label={`مرحله ${stepIndex + 1} از ${stepCount}`}
        className={
          isMobile
            ? "fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[72] mx-auto max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200 motion-reduce:animate-none"
            : "fixed z-[72] w-[min(22rem,calc(100vw-2rem))] animate-in fade-in duration-200 motion-reduce:animate-none"
        }
        style={isMobile ? undefined : desktopCardStyle}
      >
        <div className="relative rounded-[1.5rem] border border-border/70 bg-card/95 p-4 text-right shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onFinish}
            aria-label={`رد کردن ${ariaLabel}`}
            className="absolute left-2 top-2 size-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden="true" />
          </Button>

          <p className="text-xs font-bold text-primary">
            {`${(stepIndex + 1).toLocaleString("fa-IR")} از ${stepCount.toLocaleString("fa-IR")}`}
          </p>
          <h2 className="mt-1.5 pl-8 text-base font-extrabold tracking-tight">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>

          <div className="mt-4 flex items-center gap-2">
            <Button type="button" onClick={onFinish} variant="outline" className="font-bold">
              رد کردن
            </Button>
            <Button type="button" onClick={onNext} className="flex-1 font-bold">
              {isFinalStep ? "متوجه شدم" : "بعدی"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
