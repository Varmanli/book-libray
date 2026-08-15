"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOnboardingOverlay } from "@/components/onboarding/OnboardingProvider";
import { canStartProfileMenuTour } from "@/lib/onboarding/eligibility";
import {
  PROFILE_MENU_TOUR_ID,
  PROFILE_MENU_TOUR_STEPS,
  type ProfileMenuOnboardingTarget,
} from "@/lib/onboarding/tours";
import {
  isTourSeen,
  markTourSeen,
  ONBOARDING_STORAGE_KEY,
} from "@/lib/onboarding/storage";

type TargetRect = Pick<DOMRect, "top" | "right" | "bottom" | "left" | "width" | "height">;

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";
const SPOTLIGHT_PADDING = 6;

function getTarget(target: ProfileMenuOnboardingTarget): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(`[data-onboarding="${target}"]`)).find(
      (candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      },
    ) ?? null
  );
}

function hasSeenTour(): boolean {
  try {
    return isTourSeen(localStorage.getItem(ONBOARDING_STORAGE_KEY), PROFILE_MENU_TOUR_ID);
  } catch {
    return true;
  }
}

function persistSeenTour(): void {
  try {
    localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      markTourSeen(localStorage.getItem(ONBOARDING_STORAGE_KEY), PROFILE_MENU_TOUR_ID),
    );
  } catch {
    // Avoid promising a one-time tour in browsers where storage is unavailable.
  }
}

export default function ProfileMenuTour({ open }: { open: boolean }) {
  const { activeTourId, finishTour, startTour } = useOnboardingOverlay();
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const startedRef = useRef(false);
  const attemptedOpenRef = useRef(false);

  const finish = useCallback(() => {
    if (!startedRef.current && stepIndex === null) return;

    persistSeenTour();
    startedRef.current = false;
    activeTargetRef.current = null;
    setStepIndex(null);
    setTargetRect(null);
    finishTour(PROFILE_MENU_TOUR_ID);
  }, [finishTour, stepIndex]);

  const updateTarget = useCallback(() => {
    const step = stepIndex === null ? null : PROFILE_MENU_TOUR_STEPS[stepIndex];
    if (!step) return;

    const target = getTarget(step.target);
    if (!target) {
      finish();
      return;
    }

    activeTargetRef.current = target;
    setTargetRect(target.getBoundingClientRect());
  }, [finish, stepIndex]);

  useEffect(() => {
    if (!open) {
      attemptedOpenRef.current = false;
      return;
    }

    if (stepIndex !== null || attemptedOpenRef.current) return;
    attemptedOpenRef.current = true;

    const timeout = window.setTimeout(() => {
      if (
        !canStartProfileMenuTour({
          isAuthenticated: true,
          hasSeenTour: hasSeenTour(),
          hasActiveTour: activeTourId !== null,
        }) ||
        !getTarget(PROFILE_MENU_TOUR_STEPS[0].target)
      ) {
        return;
      }

      if (startTour(PROFILE_MENU_TOUR_ID)) {
        startedRef.current = true;
        setStepIndex(0);
      }
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [activeTourId, open, startTour, stepIndex]);

  useEffect(() => {
    if (stepIndex === null) return;

    updateTarget();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    const handleUpdate = () => window.requestAnimationFrame(updateTarget);

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("keydown", handleEscape);
    const observer = new ResizeObserver(handleUpdate);
    if (activeTargetRef.current) observer.observe(activeTargetRef.current);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("keydown", handleEscape);
      observer.disconnect();
    };
  }, [finish, stepIndex, updateTarget]);

  useEffect(() => {
    if (stepIndex !== null && !open) finish();
  }, [finish, open, stepIndex]);

  if (stepIndex === null || !targetRect) return null;

  const step = PROFILE_MENU_TOUR_STEPS[stepIndex];
  const isMobile = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  const isFinalStep = stepIndex === PROFILE_MENU_TOUR_STEPS.length - 1;
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
        top: Math.min(targetRect.bottom + 14, window.innerHeight - 196),
        left: Math.max(16, targetRect.left),
      };

  return (
    <div dir="rtl" aria-live="polite" aria-label="راهنمای منوی حساب کاربری">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-[70] rounded-xl border-2 border-primary/75 bg-transparent shadow-[0_0_0_9999px_rgba(8,14,11,0.48)] transition-all duration-200 motion-reduce:transition-none"
        style={spotlightStyle}
      />

      <section
        aria-label={`مرحله ${stepIndex + 1} از ${PROFILE_MENU_TOUR_STEPS.length}`}
        className={
          isMobile
            ? "fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[72] mx-auto max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200 motion-reduce:animate-none"
            : "fixed z-[72] w-[min(21rem,calc(100vw-2rem))] animate-in fade-in duration-200 motion-reduce:animate-none"
        }
        style={isMobile ? undefined : desktopCardStyle}
      >
        <div className="relative rounded-[1.5rem] border border-border/70 bg-card/95 p-4 text-right shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={finish}
            aria-label="رد کردن راهنمای منوی حساب"
            className="absolute left-2 top-2 size-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden="true" />
          </Button>

          <p className="text-xs font-bold text-primary">
            {`${(stepIndex + 1).toLocaleString("fa-IR")} از ${PROFILE_MENU_TOUR_STEPS.length.toLocaleString("fa-IR")}`}
          </p>
          <h2 className="mt-1.5 pl-8 text-base font-extrabold tracking-tight">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>

          <div className="mt-4 flex items-center gap-2">
            <Button type="button" onClick={finish} variant="outline" className="font-bold">
              رد کردن
            </Button>
            <Button
              type="button"
              onClick={() => (isFinalStep ? finish() : setStepIndex(stepIndex + 1))}
              className="flex-1 font-bold"
            >
              {isFinalStep ? "متوجه شدم" : "بعدی"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
