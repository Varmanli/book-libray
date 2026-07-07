"use client";

import { Toaster } from "react-hot-toast";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import ThemeProvider from "@/components/ThemeProvider";
import { ConfirmProvider } from "@/components/common/ConfirmDialog";
import DisablePwa from "@/components/pwa/DisablePwa";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ConfirmProvider>
        {children}
        <Toaster position="top-center" />
        <PerformanceMonitor />
        <DisablePwa />
      </ConfirmProvider>
    </ThemeProvider>
  );
}
