"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type OnboardingOverlayContextValue = {
  isOnboardingActive: boolean;
  activeTourId: string | null;
  startTour: (tourId: string) => boolean;
  finishTour: (tourId: string) => void;
};

const OnboardingOverlayContext = createContext<OnboardingOverlayContextValue | null>(
  null,
);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const activeTourRef = useRef<string | null>(null);

  const startTour = useCallback((tourId: string) => {
    if (activeTourRef.current) return false;

    activeTourRef.current = tourId;
    setActiveTourId(tourId);
    return true;
  }, []);

  const finishTour = useCallback((tourId: string) => {
    if (activeTourRef.current !== tourId) return;

    activeTourRef.current = null;
    setActiveTourId(null);
  }, []);

  const value = useMemo(
    () => ({
      isOnboardingActive: activeTourId !== null,
      activeTourId,
      startTour,
      finishTour,
    }),
    [activeTourId, finishTour, startTour],
  );

  return (
    <OnboardingOverlayContext.Provider value={value}>
      {children}
    </OnboardingOverlayContext.Provider>
  );
}

export function useOnboardingOverlay(): OnboardingOverlayContextValue {
  const context = useContext(OnboardingOverlayContext);
  if (!context) {
    throw new Error("useOnboardingOverlay must be used within OnboardingProvider");
  }
  return context;
}
