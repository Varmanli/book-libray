"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { OnboardingCoachmark } from "@/components/onboarding/OnboardingCoachmark";
import { useOnboardingOverlay } from "@/components/onboarding/OnboardingProvider";
import { canStartBookReadingTour } from "@/lib/onboarding/eligibility";
import {
  BOOK_READING_TOUR_ID,
  BOOK_READING_TOUR_STEPS,
  type BookReadingOnboardingTarget,
} from "@/lib/onboarding/tours";
import {
  isTourSeen,
  markTourSeen,
  ONBOARDING_STORAGE_KEY,
} from "@/lib/onboarding/storage";

type TargetRect = Pick<DOMRect, "top" | "right" | "bottom" | "left">;

const START_DELAY_MS = 900;

function getVisibleTarget(target: BookReadingOnboardingTarget): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(`[data-onboarding="${target}"]`)).find(
      (candidate) => {
        const rect = candidate.getBoundingClientRect();
        const style = window.getComputedStyle(candidate);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
      },
    ) ?? null
  );
}

function hasSeenTour(): boolean {
  try {
    return isTourSeen(localStorage.getItem(ONBOARDING_STORAGE_KEY), BOOK_READING_TOUR_ID);
  } catch {
    return true;
  }
}

function persistSeenTour(): void {
  try {
    localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      markTourSeen(localStorage.getItem(ONBOARDING_STORAGE_KEY), BOOK_READING_TOUR_ID),
    );
  } catch {
    // Do not promise a once-only tour where browser storage is unavailable.
  }
}

export default function BookReadingTour({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const pathname = usePathname();
  const { activeTourId, finishTour, startTour } = useOnboardingOverlay();
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const startedRef = useRef(false);
  const attemptedRef = useRef(false);

  const finish = useCallback(() => {
    if (!startedRef.current && stepIndex === null) return;

    persistSeenTour();
    startedRef.current = false;
    activeTargetRef.current = null;
    setStepIndex(null);
    setTargetRect(null);
    finishTour(BOOK_READING_TOUR_ID);
  }, [finishTour, stepIndex]);

  const updateTarget = useCallback(() => {
    const step = stepIndex === null ? null : BOOK_READING_TOUR_STEPS[stepIndex];
    if (!step) return;

    const target = getVisibleTarget(step.target);
    if (!target) {
      // The page may be transitioning after a real interaction. A started tour
      // should end cleanly, while an initial missing target never persists.
      finish();
      return;
    }

    activeTargetRef.current = target;
    const rect = target.getBoundingClientRect();
    if (rect.top < 8 || rect.bottom > window.innerHeight - 8) {
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
        inline: "nearest",
      });
    }
    setTargetRect(target.getBoundingClientRect());
  }, [finish, stepIndex]);

  useEffect(() => {
    if (attemptedRef.current) return;

    const timeout = window.setTimeout(() => {
      const hasAllTargets = BOOK_READING_TOUR_STEPS.every((step) =>
        Boolean(getVisibleTarget(step.target)),
      );
      if (
        !canStartBookReadingTour({
          isAuthenticated,
          hasSeenTour: hasSeenTour(),
          hasActiveTour: activeTourId !== null,
          hasAllTargets,
        })
      ) {
        attemptedRef.current = true;
        return;
      }

      if (startTour(BOOK_READING_TOUR_ID)) {
        attemptedRef.current = true;
        startedRef.current = true;
        setStepIndex(0);
      }
    }, START_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [activeTourId, isAuthenticated, startTour]);

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
    if (stepIndex !== null && !pathname.startsWith("/book/")) finish();
  }, [finish, pathname, stepIndex]);

  if (stepIndex === null || !targetRect) return null;

  return (
    <OnboardingCoachmark
      ariaLabel="راهنمای پیگیری مطالعه"
      stepIndex={stepIndex}
      stepCount={BOOK_READING_TOUR_STEPS.length}
      step={BOOK_READING_TOUR_STEPS[stepIndex]}
      targetRect={targetRect}
      onFinish={finish}
      onNext={() =>
        stepIndex === BOOK_READING_TOUR_STEPS.length - 1
          ? finish()
          : setStepIndex(stepIndex + 1)
      }
    />
  );
}
