"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { OnboardingCoachmark } from "@/components/onboarding/OnboardingCoachmark";
import { useOnboardingOverlay } from "@/components/onboarding/OnboardingProvider";
import { canStartBookNotesTour } from "@/lib/onboarding/eligibility";
import {
  BOOK_NOTES_TOUR_ID,
  BOOK_NOTES_TOUR_STEPS,
  type BookNotesOnboardingStep,
  type BookNotesOnboardingTarget,
} from "@/lib/onboarding/tours";
import {
  isTourSeen,
  markTourSeen,
  ONBOARDING_STORAGE_KEY,
} from "@/lib/onboarding/storage";

type TargetRect = Pick<DOMRect, "top" | "right" | "bottom" | "left">;

function getVisibleTarget(target: BookNotesOnboardingTarget): HTMLElement | null {
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
    return isTourSeen(localStorage.getItem(ONBOARDING_STORAGE_KEY), BOOK_NOTES_TOUR_ID);
  } catch {
    return true;
  }
}

function persistSeenTour(): void {
  try {
    localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      markTourSeen(localStorage.getItem(ONBOARDING_STORAGE_KEY), BOOK_NOTES_TOUR_ID),
    );
  } catch {
    // A browser without storage cannot reliably honor a once-only tour.
  }
}

export default function BookNotesTour({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const { activeTourId, finishTour, startTour } = useOnboardingOverlay();
  const [hasContributionEncounter, setHasContributionEncounter] = useState(false);
  const [steps, setSteps] = useState<readonly BookNotesOnboardingStep[]>([]);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const startedRef = useRef(false);
  const attemptedRef = useRef(false);
  const interactedWithContributionRef = useRef(false);

  const finish = useCallback(() => {
    if (!startedRef.current && stepIndex === null) return;

    persistSeenTour();
    startedRef.current = false;
    activeTargetRef.current = null;
    setStepIndex(null);
    setTargetRect(null);
    finishTour(BOOK_NOTES_TOUR_ID);
  }, [finishTour, stepIndex]);

  const updateTarget = useCallback(() => {
    const step = stepIndex === null ? null : steps[stepIndex];
    if (!step) return;

    const target = getVisibleTarget(step.target);
    if (!target) {
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
  }, [finish, stepIndex, steps]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const targets = ["book-public-note", "book-quote"] as const;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasContributionEncounter(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    targets.forEach((target) => {
      const element = getVisibleTarget(target);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleContributionInteraction = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-onboarding='book-public-note'], [data-onboarding='book-quote']")) {
        return;
      }

      interactedWithContributionRef.current = true;
      if (startedRef.current) finish();
    };

    document.addEventListener("pointerdown", handleContributionInteraction);
    return () => document.removeEventListener("pointerdown", handleContributionInteraction);
  }, [finish]);

  useEffect(() => {
    if (!hasContributionEncounter || attemptedRef.current) return;

    const timeout = window.setTimeout(() => {
      if (interactedWithContributionRef.current) {
        attemptedRef.current = true;
        return;
      }

      const availableSteps = BOOK_NOTES_TOUR_STEPS.filter((step) =>
        Boolean(getVisibleTarget(step.target)),
      );
      if (
        !canStartBookNotesTour({
          isAuthenticated,
          hasSeenTour: hasSeenTour(),
          hasActiveTour: activeTourId !== null,
          targetCount: availableSteps.length,
        })
      ) {
        attemptedRef.current = true;
        return;
      }

      if (startTour(BOOK_NOTES_TOUR_ID)) {
        attemptedRef.current = true;
        startedRef.current = true;
        setSteps(availableSteps);
        setStepIndex(0);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeTourId, hasContributionEncounter, isAuthenticated, startTour]);

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

  useEffect(
    () => () => {
      if (startedRef.current) {
        persistSeenTour();
        finishTour(BOOK_NOTES_TOUR_ID);
      }
    },
    [finishTour],
  );

  if (stepIndex === null || !targetRect || !steps[stepIndex]) return null;

  const step = steps[stepIndex];
  return (
    <OnboardingCoachmark
      ariaLabel="راهنمای یادداشت‌ها و تکه‌های کتاب"
      stepIndex={stepIndex}
      stepCount={steps.length}
      step={step}
      targetRect={targetRect}
      onFinish={finish}
      onNext={() => (stepIndex === steps.length - 1 ? finish() : setStepIndex(stepIndex + 1))}
    />
  );
}
