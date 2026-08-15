"use client";

import { Toaster } from "react-hot-toast";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import ThemeProvider from "@/components/ThemeProvider";
import { ConfirmProvider } from "@/components/common/ConfirmDialog";
import DisablePwa from "@/components/pwa/DisablePwa";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import HomeNavigationTour from "@/components/onboarding/HomeNavigationTour";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <OnboardingProvider>
        <ConfirmProvider>
          {children}
          <Toaster position="top-center" />
          <PerformanceMonitor />
          <DisablePwa />
          <PwaInstallPrompt />
          <HomeNavigationTour />
        </ConfirmProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}
